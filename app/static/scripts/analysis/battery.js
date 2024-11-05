import * as Constant from "./analysis-constants.js"
import {SensorState, SensorStatus, SensorEvent, Sensor} from "./sensor.js";

export const BATTERY_LOW = true;
export const BATTERY_GOOD = false;
export const BATTERY_CHARGING = true;
export const BATTERY_NOT_CHARGING = false;

export const BatteryState = {
    LOW: new SensorStatus(SensorState.WARNING, BATTERY_LOW),
    GOOD: new SensorStatus(SensorState.WORKING, BATTERY_GOOD),
    CHARGING: new SensorStatus(SensorState.WORKING, BATTERY_CHARGING),
    NOT_CHARGING: new SensorStatus(SensorState.FAULTY, BATTERY_NOT_CHARGING),
}

export class Battery extends Sensor {
    constructor(engine) {
        super();

        this._state = BatteryState.GOOD;
        this._engine = engine;
        this._minVoltageDataframe = new SensorEvent(-1, undefined, undefined);
    }

    update(dataframes) {
        super.update(dataframes);
        this._minVoltageDataframe = this._getMinVoltage(dataframes);
    }

    isLow() {
        if (this._firstDataframe === undefined) return BATTERY_GOOD;

        const faulty = (this._firstDataframe._80x08_BatteryVoltage < Constant.MIN_BATTERY_VOLTAGE);
        if (faulty) {
            this._status = BatteryState.LOW;
        }

        return this._status.faulty;
    }

    isCharging() {
        this._status = BatteryState.CHARGING;

        if (!this._engine.isRunning) {
            // if the engine is not running, assume the alternator is working
            return this._status.faulty;
        }

        // if the current voltage is at or higher than the charged voltage we can assume the alternator is charging
        if (this._currentDataframe._80x08_BatteryVoltage >= Constant.MIN_BATTERY_CHARGING_VOLTAGE) {
            return this._status.faulty;
        }

        if (this._hasCrankingProfile()) {
            if (this._minVoltageDataframe.index === -1) {
                // dataframes not found, assume charging
                return this._status.faulty;
            }

            if (this._dataframes.length <= this._minVoltageDataframe.index + Constant.MIN_BATTERY_RECOVERY_TIME) {
                // not enough time for battery to have recovered, assuming charging
                return this._status.faulty;
            }
        }

        // compare voltage in current dataframe against the voltage in the first dataframe
        if (this._currentDataframe._80x08_BatteryVoltage > this._firstDataframe._80x08_BatteryVoltage) {
            return this._status.faulty;
        }

        this._status = BatteryState.NOT_CHARGING;
        return this._status.faulty;
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