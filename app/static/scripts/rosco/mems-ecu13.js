import * as Command from "./mems-commands.js";
import {MemsEcu16} from "./mems-ecu16.js";

//
// MEMS 1.3 ECU Reader
// This version of the ECU has a simple initialisation sequence and supports
// 0x80 standard dataframe only
//
// in other respects the ecu responds the same as 1.6
//

export class MemsEcu13 extends MemsEcu16 {
    constructor(responseEventQueue, serialInterface) {
        super(responseEventQueue, serialInterface);
        // override the dataframe commands to request 0x80 dataframes only
        this.setDataframeCommands([Command.MEMS_Dataframe80]);
    }
}
