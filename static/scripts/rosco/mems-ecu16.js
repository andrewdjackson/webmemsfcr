import {MemsSerialInterface} from "./mems-serial.js";
import {ECUReader} from "./mems-ecureader.js";
import {
    Dataframe7d,
    Dataframe80,
    MEMS_Dataframe80,
    MEMS_ECUId,
    MEMS_Heartbeat,
    MEMS_InitA,
    MEMS_InitB
} from "./mems-commands.js";
import {EventTopic} from "./mems-queue.js";

export class MemsEcu16 extends ECUReader {
    constructor(responseEventQueue) {
        super(responseEventQueue);

        this.interval = 1000;
        this._serial = new MemsSerialInterface();
        //this._responseEventQueue.subscribe(EventTopic.Dataframe, this.GenerateDataframeFromECUResponse);
    }

    async Connect() {
        await super.Connect();

        return await this._serial.Connect()
            .then((connected) => {
                return this._initialise();
            }).catch((error) => {
                return false;
            });
    }

    Disconnect() {
        super.Disconnect();

        return this._serial.Disconnect();
    }

    //
    // ecureader super class just echo's to console
    // override to send command over the serial port
    //
    async SendToECU(ecuCommand) {
        return await this._serial.SendAndReceive(ecuCommand.command, ecuCommand.responseSize);
    }

    async  _initialise() {
        await this._serial.SendAndReceive(MEMS_InitA.command, MEMS_InitA.responseSize);
        await this._serial.SendAndReceive(MEMS_InitB.command, MEMS_InitB.responseSize);
        await this._serial.SendAndReceive(MEMS_Heartbeat.command, MEMS_Heartbeat.responseSize);
        await this._serial.SendAndReceive(MEMS_ECUId.command, MEMS_ECUId.responseSize);
        this.StartDataframeLoop();
        return true;
    }

    GenerateDataframeFromECUResponse(ecuResponse) {
        let df;

        if (ecuResponse.command.command === MEMS_Dataframe80.command) {
            df = new Dataframe80();
            df.Update(ecuResponse);
            console.log(`dataframe80 generated ${JSON.stringify(df)}`);
        } else {
            df = new Dataframe7d();
            df.Update(ecuResponse);
            console.log(`dataframe7d generated ${JSON.stringify(df)}`);
        }

        return df;
    }
}
