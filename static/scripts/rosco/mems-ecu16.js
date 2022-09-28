import {MemsSerialInterface} from "./mems-serial.js";
import {EventQueue} from "./mems-queue.js";
import {ECUReader} from "./mems-ecureader.js";

export class MemsEcu16 extends ECUReader {
    constructor(responseEventQueue) {
        super(responseEventQueue);
        this._serial = new MemsSerialInterface();
    }

    async Connect() {
        return await this._serial.Connect()
            .then((connected) => {
                this._initialise();
                return true;
            }).catch((error) => {
                return false;
            });
    }

    Disconnect() {
        return this._serial.Disconnect();
    }


    // override for Mems 1.6
    async SendToECU(ecuCommand) {
        return await this._serial.SendAndReceive(ecuCommand.command, ecuCommand.responseSize);
    }

    async  _initialise() {
        await this._serial.SendAndReceive(0xca, 1);
        await this._serial.SendAndReceive(0x75, 1);
        await this._serial.SendAndReceive(0xf4, 1);
        await this._serial.SendAndReceive(0xd0, 6);
    }
}
