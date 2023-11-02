import {MemsBrowserSerialInterface} from "../mems-browser-serial.js";

export class MemsEcu2JBrowserSerialInterface extends MemsBrowserSerialInterface {
    constructor() {
        super();
    }

    //
    // open the port for read / write
    // MEMS 2J ECU requires a 10400 baud rate
    //
    async _open() {
        await this._port.open({baudRate: 10400, bufferSize: 1,})
            .then(async () => {
                return true;
            }).catch(() => {
                this._port = undefined;
                return false;
            });
    }
}
