import {MemsSerialInterface} from "./mems-serial.js";
import {ECUReader} from "./mems-ecureader.js";
import * as Command from "./mems-commands.js";
import * as Dataframe from "./mems-dataframe.js";

//
// MEMS 1.6 ECU Reader
// This version of the ECU has a simple initialisation sequence and supports
// 0x80 standard dataframe and 0x7D extended dataframe responses
//

export class MemsEcu16 extends ECUReader {
    constructor(responseEventQueue) {
        super(responseEventQueue);
        this._serial = new MemsSerialInterface();
        this.test = false;
    }

    //
    // connect the serial port
    //
    async connect() {
        await super.connect();

        return await this._serial.connect()
            .then((connected) => {
                return this._initialise();
            }).catch((error) => {
                console.error(`exception connecting to port ${error}`);
                return false;
            });
    }

    //
    // disconnect the serial port
    //
    async disconnect() {
        await super.disconnect();

        if (this._serial.isConnected) {
            this._serial.disconnect();
        }

        return this.isConnected;
    }

    //
    // ecureader super class just echo's to console
    // override to send command over the serial port
    //
    async sendToECU(ecuCommand) {
        return await this._serial.sendAndReceiveFromSerial(ecuCommand.command, ecuCommand.responseSize);
    }

    //
    // initialise the ECU
    // use direct serial comms rather than the command queue for initialisation
    // this function requires the command as a byte array and returns the response as a byte array
    //
    async  _initialise() {
        if (this._serial.isConnected) {
            let response;

            // send heartbeat to 'wake-up' serial port
            // hack to fix what seems the first byte not getting a response to over the web serial api
            await this._serial.sendAndReceiveFromSerial(Command.MEMS_Heartbeat.command, Command.MEMS_Heartbeat.responseSize);

            // initialisation sequence
            response = await this._serial.sendAndReceiveFromSerial(Command.MEMS_InitA.command, Command.MEMS_InitA.responseSize);

            if (Command.MEMS_InitA.command === response[0]) {
                await this._serial.sendAndReceiveFromSerial(Command.MEMS_InitB.command, Command.MEMS_InitB.responseSize);
                await this._serial.sendAndReceiveFromSerial(Command.MEMS_Heartbeat.command, Command.MEMS_Heartbeat.responseSize);
                await this._serial.sendAndReceiveFromSerial(Command.MEMS_ECUId.command, Command.MEMS_ECUId.responseSize);

                this.startDataframeLoop();

                return true;
            }
        }

        console.error(`initialisation of the ecu failed`);
        await this._serial.close();

        return false;
    }

    generateDataframeFromECUResponse(ecuResponse) {
        let df;

        if (ecuResponse.command.command === Command.MEMS_Dataframe80.command) {
            df = new Dataframe.Dataframe80();
            df.updateValuesFromEcuResponse(ecuResponse);
            this._engineRunning = (df._80x01_EngineRPM > 0);

            console.info(`dataframe80 generated ${JSON.stringify(df)}`);
        } else {
            df = new Dataframe.Dataframe7d();
            df.updateValuesFromEcuResponse(ecuResponse);
            console.info(`dataframe7d generated ${JSON.stringify(df)}`);
        }

        return df;
    }
}
