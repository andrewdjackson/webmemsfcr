import {OperationalStatus} from "./operational-status.js";
import * as Faults from "./analysis-faults.js";
import {AtOperatingTemp} from "./analysis-faults.js";

const CURRENT_DATAFRAME = -1;
const PREVIOUS_DATAFRAME = -2;

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

    get faults() {
        this._analyseFaultLog();

        return this._faultLog;
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

    //
    // analyse active faults in the current log
    //
    _analyseFaultLog() {
        this._faultLog = [];

        this._addEngineWarmToFaults();

        if (this._dataframeLog.hasLoggedData) {
            this._addFault("_80x08_BatteryVoltage", Faults.BatteryFault);
            this._addFault("_80x17_CoilTime", Faults.CoilFault);
            this._addFault("_80x03_CoolantTemp", Faults.CoolantFault);
            this._addFault("_80x10_IdleHot", Faults.IdleFault);
            this._addFault("_80x12_IACPosition", Faults.IACFault);
            this._addFault("_7Dx1F_JackCount", Faults.JackFault);
            this._addFault("_7Dx0F_IdleBasePosition", Faults.IdleSpeedFault);
            this._addFault("IntakeAirTempSensorFault", Faults.AirTempFault);
            this._addFault("_80x07_ManifoldAbsolutePressure", Faults.MapFault);
            this._addFault("_80x07_ManifoldAbsolutePressure", Faults.VacuumFault);
            this._addFault("_7Dx06_LambdaVoltage", Faults.O2Fault);
            this._addFault("_7Dx09_LambdaStatus", Faults.O2Fault);
            this._addFault("ThermostatFaulty", Faults.ThermostatFault);
            this._addFault("ThrottlePotCircuitFault", Faults.ThrottleFault);
         }

        this._faultLog = this._dedupArrayByProperty(this._faultLog, "id");
    }

    _addFault(metric, faultTemplate) {
        let faultCount = this._countFaults(metric);
        if (faultCount > 0) {
            let fault = new Faults.Fault(faultTemplate.id, faultTemplate.title, faultTemplate.level);
            fault.count = faultCount;
            this._faultLog.push(fault);
        }
    }

    _addEngineWarmToFaults() {
        if (this._statusLog.at(CURRENT_DATAFRAME).isEngineWarm === true) {
            let fault = new Faults.Fault(Faults.AtOperatingTemp.id, Faults.AtOperatingTemp.title, Faults.AtOperatingTemp.level);
            fault.count = 1;
            this._faultLog.push(fault);
        }
    }

    _dedupArrayByProperty(arr, prop) {
        let dedupedArray = Array.from(
            arr
                .reduce(
                    (acc, item) => (
                        item && item[prop] && acc.set(item[prop], item), acc
                    ), // using map (preserves ordering)
                    new Map()
                )
                .values()
        )

        dedupedArray.sort(this._sortByMessageId);
        return dedupedArray;
    }

    _sortByMessageId(a, b) {
        return a.id - b.id;
    }

    _countFaults(metric) {
        let count = 0;

        this._statusLog.forEach((item) => {
            if (item.operationalFaults[metric]) {
                count++;
            }
        });

        return count;
    }
}
