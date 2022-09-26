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

    async  _initialise() {
        await this._serial.SendAndReceive(0xca, 1);
        await this._serial.SendAndReceive(0x75, 1);
        await this._serial.SendAndReceive(0xf4, 1);
        await this._serial.SendAndReceive(0xd0, 5);
    }

    Disconnect() {
        return this._serial.Disconnect();
    }

    async GetDataframes(callback) {
        await this._serial.SendAndReceive(0x80, 29);
        await this._serial.SendAndReceive(0x7d, 33);

        callback();
    }
}
