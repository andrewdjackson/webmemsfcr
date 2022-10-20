import {OperationalStatus} from "./operational-status.js";

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
            const opstatus = new OperationalStatus(this.dataframes);
            //this._faults.push(opstatus.faults);
            this._status.push(opstatus);
        }
    }
}

