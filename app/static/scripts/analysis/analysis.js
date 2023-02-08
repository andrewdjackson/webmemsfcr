import {OperationalStatus} from "./operational-status.js";
import * as Faults from "./analysis-faults.js";

export class Analysis {
    constructor(dataframeLog) {
        this._dataframeLog = dataframeLog;
        this._statusLog = [];
        this._faultLog = [];
    }

    get dataframes() {
        return this._dataframeLog.dataframes;
    }

    get status() {
        return this._statusLog;
    }

    get faultLog() {
        this._analyseFaultLog();

        return this._faultLog;
    }

    //
    // analyse active faults in the current log
    //
    _analyseFaultLog() {
        if (this._dataframeLog.hasLoggedData) {
            let faultCount = this._countFaults("_80x07_ManifoldAbsolutePressure");
            if (faultCount > 0) {
                let fault = new Faults.Fault(Faults.CoolantFault.id, Faults.CoolantFault.title, Faults.CoolantFault.level);
                fault.count = faultCount;
                this._faultLog.push(fault);
            }
        }
    }

    //
    // analysis uses the dataframe log
    // easy references to the current complete dataframe and the first one logged are updated
    //
    analyse() {
        if (this._dataframeLog.hasLoggedData) {
            const opStatus = new OperationalStatus(this.dataframes);
            this._statusLog.push(opStatus);
        }
    }

    _countFaults(metric) {
        let state = false;
        let count = 0;

        this._statusLog.forEach((item) => {
            if (item.operationalFaults[metric]) {
                count++;
            }
        });

        return count;
    }
}
