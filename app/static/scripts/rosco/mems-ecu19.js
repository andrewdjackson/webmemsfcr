import * as Command from "./mems-commands.js";
import {MemsEcu16} from "./mems-ecu16.js";

//
// MEMS 1.9 ECU Reader
// This version of the ECU requires aa 5 baud 'wake up' sequence
// in other respects the ecu responds the same as 1.6
//

export class MemsEcu19 extends MemsEcu16 {
    constructor(responseEventQueue) {
        super(responseEventQueue);
    }
/*
    async waitUntil(timestampMs, pause) {
        const start = performance.now();
        while (performance.now() < timestampMs) {
            await new Promise((resolve) => setTimeout(resolve, 1));
            let delta = performance.now() - start;
            if (delta < 10) {
                while (performance.now() < timestampMs) {}
                break;
            }
        }
        return timestampMs + pause;
    }
    async assertSignalAndWait(before, pause, brk) {
        await this._serial.port.setSignals({ break: brk });
        return await this.waitUntil(before, pause);
    }

    async slowInit(ecuAddress) {
        let pause = 200;
        this._serial.stage = 2;
        let before = await this.assertSignalAndWait(performance.now(), pause, false);
        before = await this.assertSignalAndWait(before, pause, true);
        this._serial.stage += 0.3;
        for (var i = 0; i < 8; i++) {
            let bit = (ecuAddress >> i) & 1;
            before = await this.assertSignalAndWait(before, pause, !bit);
        }
        this._serial.stage += 0.3;
        await this.assertSignalAndWait(before, pause, false);
    }
    */
}
