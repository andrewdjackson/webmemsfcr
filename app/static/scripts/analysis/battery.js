import * as Constant from "./analysis-constants.js"
import {SensorEvent, Sensor} from "./sensor.js";

export const BATTERY_LOW = true;
export const BATTERY_GOOD = false;
export const BATTERY_CHARGING = true;
export const BATTERY_NOT_CHARGING = false;

export class Battery  extends Sensor {
    constructor(engine) {
        super();

        this._engine = engine;
        this._minVoltageDataframe = new SensorEvent(-1, undefined, undefined);
    }

    update(dataframes) {
        super.update(dataframes);
        this._minVoltageDataframe = this._getMinVoltage(dataframes);
    }

    isLow() {
        if (this._firstDataframe === undefined) return false;

        return (this._firstDataframe._80x08_BatteryVoltage < Constant.MIN_BATTERY_VOLTAGE);
    }

    isCharging() {
        if (!this._engine.isRunning) {
            // if the engine is not running, assume the alternator is working
            return BATTERY_CHARGING;
        }

        // if the current voltage is at or higher than the charged voltage we can assume the alternator is charging
        if (this._currentDataframe._80x08_BatteryVoltage >= Constant.MIN_BATTERY_CHARGING_VOLTAGE) {
            return BATTERY_CHARGING;
        }

        if (this._hasCrankingProfile()) {
            if (this._minVoltageDataframe.index === -1) {
                // dataframes not found, assume charging
                return BATTERY_CHARGING;
            }

            if (this._dataframes.length <= this._minVoltageDataframe.index + Constant.MIN_BATTERY_RECOVERY_TIME) {
                // not enough time for battery to have recovered, assuming charging
                return BATTERY_CHARGING;
            }
        }

        // compare voltage in current dataframe against the voltage in the first dataframe
        if (this._currentDataframe._80x08_BatteryVoltage > this._firstDataframe._80x08_BatteryVoltage) {
            return BATTERY_CHARGING;
        }

        return BATTERY_NOT_CHARGING;
    }

    _hasCrankingProfile() {
        if (this._minVoltageDataframe.index === -1) {
            // dataframes not found, no cranking profile
            return false;
        }

        // detect a significant voltage drop from the initial battery state
        const highestCrankVoltage = this._firstDataframe._80x08_BatteryVoltage - Constant.MIN_BATTERY_RECOVERY_VOLTAGE;
        return (this._minVoltageDataframe.value < highestCrankVoltage);
    }

    _getMinVoltage(dataframes) {
        // find the lowest voltage
        const batteryVoltage = Math.min.apply(Math, dataframes.map(function(df){ return df._80x08_BatteryVoltage; }));
        return this._findDataframe(dataframes, batteryVoltage);
    }

    _findDataframe(dataframes, dataframeToFind) {
        // find the first instance
        const dataframe =  dataframes.find(function(df){ return df._80x08_BatteryVoltage === dataframeToFind; });

        if (dataframe === undefined) {
            return new SensorEvent(-1, undefined, undefined);
        }

        // and where it is in the dataframes array
        const index = dataframes.indexOf(dataframe);

        return new SensorEvent(index, dataframe._80x08_BatteryVoltage, dataframe);
    }
}