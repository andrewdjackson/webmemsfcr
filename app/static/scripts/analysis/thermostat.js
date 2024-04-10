import * as Constant from "./analysis-constants.js"
import {SensorEvent, Sensor} from "./sensor.js";

export const THERMOSTAT_FAULTY = true;
export const THERMOSTAT_WORKING = false;

export class Thermostat extends Sensor {
    constructor(dataframes) {
        super(dataframes);

        this._maxTemperatureDataframe = this._getPeakTemperature(dataframes);
        this._expectedThermostatOpenTime = this._getExpectedThermostatOpenTime().getTime();
    }

    isFaulty() {
        // engine is too cold for the thermostat to open
        if (this._engineTooColdForThermostatToOpen()) {
            return THERMOSTAT_WORKING;
        }

        // we need to wait until we have enough time for the thermostat to react
        if (this._tooEarlyToDiagnose()) {
            return THERMOSTAT_WORKING;
        }

        // temperature above the thermostat opening temperature
        if (this._isThermostatOpenWhenExpected()) {
            // warmed as expected, then cooled as expected when the thermostat opened
            return THERMOSTAT_WORKING;
        }

        return THERMOSTAT_FAULTY;
    }

    _engineTooColdForThermostatToOpen() {
        return this._maxTemperatureDataframe.value < Constant.THERMOSTAT_OPEN_TEMPERATURE;
    }


    _tooEarlyToDiagnose() {
        return (this._expectedThermostatOpenTime > this._currentTime);
    }

    //
    // has the coolant temperature dropped after the thermostat has opened
    //
    _isThermostatOpenWhenExpected() {
        return (this._currentTime > this._expectedThermostatOpenTime) && (this._currentDataframe._80x03_CoolantTemp < this._maxTemperatureDataframe.value);
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

    _getExpectedThermostatOpenTime() {
        if (this._engineTooColdForThermostatToOpen()) {
            // predict the thermostat opening time
            let currentTime = new Date(this._currentDataframe._80x00_Time);
            let degreesToOpen = Constant.THERMOSTAT_OPEN_TEMPERATURE - this._currentDataframe._80x03_CoolantTemp;
            let secondsToOpen = (degreesToOpen * Constant.SECONDS_PER_DEGREE) + Constant.THERMOSTAT_OPEN_DELAY;
            return new Date(currentTime.getTime() + secondsToOpen);
        }

        return new Date(this._maxTemperatureDataframe.dataframe._80x00_Time);
    }
}