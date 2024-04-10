import * as Constant from "./analysis-constants.js";

export const SENSOR_FAULTY = true;
export const SENSOR_WORKING = false;

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
    _dataframes;
    _firstDataframe;
    _previousDataframe;
    _currentDataframe;
    _currentTime;

    constructor(dataframes) {
        this._dataframes = dataframes;
        this._firstDataframe = dataframes.at(Constant.FIRST_DATAFRAME);
        this._currentDataframe = dataframes.at(Constant.CURRENT_DATAFRAME);
        this._currentTime = new Date(this._currentDataframe._80x00_Time).getTime();

        if (this._dataframes.length > 1) {
            this._previousDataframe = dataframes.at(Constant.PREVIOUS_DATAFRAME);
        }
    }

    isFaulty() {
        return SENSOR_WORKING;
    }
}