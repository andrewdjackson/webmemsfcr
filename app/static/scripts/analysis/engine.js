import * as Constant from "./analysis-constants.js";
import {SensorEvent, Sensor} from "./sensor.js";

export class Engine extends Sensor {
    isRunning;
    isIdle;
    isWarm;
    startedAt;

    constructor() {
        super();

        // start with engine running state as other states depend upon this
        this.isRunning = false;
        this.isIdle = true;
        this.isWarm = false;
        this.startedAt = new SensorEvent(-1, undefined, undefined);
    }

    update(dataframes) {
        super.update(dataframes);

        this.isRunning = this._isRunning();
        this.isIdle = this._isIdle();
        this.isWarm = this._isWarm();
        this.startedAt = this._startedAt();
    }

    _isRunning() {
        return (this._currentDataframe._80x01_EngineRPM > Constant.ENGINE_NOT_RUNNING);
    }

    _isIdle() {
        return ((this.isRunning) && (this._currentDataframe._80x09_ThrottlePotSensor <= Constant.DEFAULT_IDLE_THROTTLE_POT_VOLTAGE));
    }

    _isWarm() {
        return (this._currentDataframe._80x03_CoolantTemp >= Constant.MIN_ENGINE_OPERATING_TEMPERATURE);
    }

    _startedAt() {
        const dataframe = this._dataframes.find(function (df) {
            return df._80x01_EngineRPM > Constant.ENGINE_NOT_RUNNING;
        });

        if (dataframe === undefined) {
            return new SensorEvent(-1, undefined, undefined);
        }

        // and where it is in the dataframes array
        const index = this._dataframes.indexOf(dataframe);
        const value = new Date(dataframe._80x00_Time).getTime()

        return new SensorEvent(index, value, dataframe);
    }
}