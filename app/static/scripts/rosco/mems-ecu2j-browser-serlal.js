import * as Command from "./mems-commands.js";
import {MemsBrowserSerialInterface} from "./mems-browser-serial.js";
import {MEMS_KLineInitComplete, MEMS_KLineInitEcho, MEMS_KLineInitWakeup} from "./mems-commands.js";

export class MemsEcu2JBrowserSerialInterface extends MemsBrowserSerialInterface {
    constructor() {
        super();

        this._reader;
        this._writer;
    }

    //
    // open the port for read / write
    // MEMS 2J ECU requires a 10400 baud rate
    //
    async _open() {
        return await this._port.open({baudRate: 10400, bufferSize: 1,})
            .then(async () => {
                return true;
            }).catch(() => {
                this._port = undefined;
                return false;
            });
    }
}
