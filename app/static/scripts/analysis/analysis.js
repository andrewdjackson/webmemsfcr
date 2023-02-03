import {OperationalStatus} from "./operational-status.js";

export class Analysis {
    constructor(dataframeLog) {
        this._dataframeLog = dataframeLog;
        this._status = [];
    }

    get dataframes() {
        return this._dataframeLog.dataframes;
    }

    get status() {
        return this._status;
    }

    get faults() {
        return this._status.faults;
    }

    //
    // analysis uses the dataframe log
    // easy references to the current complete dataframe and the first one logged are updated
    //
    analyse() {
        if (this._dataframeLog.hasLoggedData) {
            const opStatus = new OperationalStatus(this.dataframes);
            this._status.push(opStatus);
        }
    }
}
