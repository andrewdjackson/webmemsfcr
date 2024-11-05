import * as Constant from "./analysis-constants.js";

export const SENSOR_FAULTY = true;
export const SENSOR_WORKING = false;

export const SensorState = {
    PASSIVE: "passive",
    TESTING: "testing",
    WARNING: "warning",
    FAULTY : "fault",
    WORKING: "nofault"
}

export class SensorStatus {
    faulty;
    state;

    constructor(state, faulty) {
        this.state = state;
        this.faulty = faulty;
    }
}


export class SensorEvent {
    index;
    dataframe;
    value;

    constructor(index, value, dataframe) {
        this.index = index;
        this.value = value;
        this.dataframe = dataframe;
    }
}

export class Sensor {
    _status;
    _dataframes;
    _firstDataframe;
    _previousDataframe;
    _currentDataframe;
    _currentTime;

    constructor() {
        this._status = new SensorStatus(SensorState.WORKING, SENSOR_WORKING)
    }

    update(dataframes) {
        try {
            this._dataframes = dataframes;
            this._firstDataframe = dataframes.at(Constant.FIRST_DATAFRAME);
            this._currentDataframe = dataframes.at(Constant.CURRENT_DATAFRAME);
            this._currentTime = new Date(this._currentDataframe._80x00_Time).getTime();

            if (this._dataframes.length > 1) {
                this._previousDataframe = dataframes.at(Constant.PREVIOUS_DATAFRAME);
            }
        } catch(e) {
            console.warn(`exception updating sensor (${e})`);
        }
    }

    Status() {
        return this._status;
    }

    isFaulty() {
        return this.state.faulty;
    }
}