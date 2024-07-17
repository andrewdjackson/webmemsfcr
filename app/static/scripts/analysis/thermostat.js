import * as Constant from "./analysis-constants.js"
import {SensorEvent, Sensor} from "./sensor.js";

export const THERMOSTAT_FAULTY = true;
export const THERMOSTAT_WORKING = false;
export const THERMOSTAT_OPEN_DEGREES_DROP = 4;
export const THERMOSTAT_OPEN = true;
export const THERMOSTAT_CLOSED = false;
export const THERMOSTAT_READINGS_AFTER_PEAK = 10;

export class Thermostat extends Sensor {
    _latestThermostatOpenTime;
    _maxTemperatureDataframe;


    constructor() {
        super();
        this._latestThermostatOpenTime = undefined;
    }

    update(dataframes) {
        super.update(dataframes);

        this._maxTemperatureDataframe = this._getPeakTemperature(dataframes);

        if (this._latestThermostatOpenTime === undefined) {
            this._latestThermostatOpenTime = this._getLatestThermostatOpenTime().getTime();
        }
    }

    isFaulty() {
        // don't re-evaluate once the thermostat has been shown to be working
        if (this._thermostatOpened) return THERMOSTAT_WORKING;

        // engine is too cold for the thermostat to open
        if (this._engineTooColdForThermostatToOpen()) {
            return THERMOSTAT_WORKING;
        }

        // we need to wait until we have enough time for the thermostat to react
        if (this._tooEarlyToDiagnose()) {
            return THERMOSTAT_WORKING;
        }

        // temperature above the thermostat opening temperature
        if (this._hasThermostatOpened()) {
            // warmed as expected, then cooled as expected when the thermostat opened
            return THERMOSTAT_WORKING;
        }

        return THERMOSTAT_FAULTY;
    }

    _engineTooColdForThermostatToOpen() {
        if (this._maxTemperatureDataframe === undefined) return true;
        return this._maxTemperatureDataframe.value < Constant.THERMOSTAT_OPEN_TEMPERATURE;
    }

    _tooEarlyToDiagnose() {
        return (this._latestThermostatOpenTime > this._currentTime);
    }

    _getPeakTemperature(dataframes) {
        // find the highest temperature
        const maxCoolantTemperature = Math.max.apply(Math, dataframes.map(function(df){ return df._80x03_CoolantTemp; }));

        // find the fist instance of this
        const dataframe =  dataframes.find(function(df){ return df._80x03_CoolantTemp === maxCoolantTemperature; });

        // and where it is in the dataframes array
        const index = dataframes.indexOf(dataframe);

        return new SensorEvent(index, dataframe._80x03_CoolantTemp, dataframe);
    }

    _hasThermostatOpened() {
        if (!this._engineTooColdForThermostatToOpen()) {
            // expect the current coolant temperature to have dropped by a few degrees
            const thermostatOpenedTemperature= this._maxTemperatureDataframe.value - THERMOSTAT_OPEN_DEGREES_DROP;
            return (this._currentDataframe._80x03_CoolantTemp < thermostatOpenedTemperature);
        }

        return false;
    }

    _getLatestThermostatOpenTime() {
        // predict the thermostat opening time
        const currentTime = new Date(this._currentDataframe._80x00_Time);
        const degreesToOpen = Constant.THERMOSTAT_OPEN_TEMPERATURE - this._currentDataframe._80x03_CoolantTemp;
        const secondsToOpen = (degreesToOpen * Constant.SECONDS_PER_DEGREE);// + Constant.THERMOSTAT_OPEN_DELAY;
        return new Date(currentTime.getTime() + (secondsToOpen * 1000));
    }
}