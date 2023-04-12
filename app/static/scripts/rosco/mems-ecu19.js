import {MemsEcu16} from "./mems-ecu16.js";
import * as Command from "./mems-commands.js";

//
// MEMS 1.9 ECU Reader
// This version of the ECU requires aa 5 baud 'wake up' sequence
// in other respects the ecu responds the same as 1.6
//

export class MemsEcu19 extends MemsEcu16 {
    constructor(responseEventQueue, serialInterface) {
        console.info("setting ECU to MEMS 1.9");
        super(responseEventQueue, serialInterface);
    }

    //
    // Override Mems 1.6 initialisation to provide slow init and wakeup required by the MEMS 1.9
    //
    async _initialise() {
        let klineInitialised = false;

        console.debug("performing MEMS 1.9 k-line initialisation");

        klineInitialised = await this._serial.kLineInitialisation();

        // continue with standard initialisation sequence
        if (klineInitialised) {
            return await super._initialise();
        }

        console.warn("kline wakeup and initialisation failed");
        return false;
    }
}
