import {OperationalStatus} from "./operational-status.js";

export class Fault {
    index;
    metric;
    text;
    fault_type;
}

export class Analysis {
    constructor(dataframeLog) {
        this.dataframeLog = dataframeLog;
        this.dataframes = dataframeLog.dataframes;
        this._status = [];
        this._faults = [];
    }

    get status() {
        return this._status;
    }

    get faults() {
        return this._faults;
    }

    //
    // analysis uses the dataframe log
    // easy references to the current complete dataframe and the first one logged are updated
    //
    analyse() {
        if (this.dataframeLog.hasLoggedData) {
            const opStatus = new OperationalStatus(this.dataframes);
            const opFaults = opStatus.faults;

            this._faults.push(opFaults);
            this._status.push(opStatus);
        }
    }
}
