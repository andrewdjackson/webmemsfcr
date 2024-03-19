import * as Constant from "./analysis-constants.js"

export const BATTERY_LOW = true;
export const BATTERY_GOOD = false;
export const BATTERY_CHARGING = true;
export const BATTERY_NOT_CHARGING = false;

class BatteryVoltage {
    index;
    dataframe;
    voltage;

    constructor(index, dataframe) {
        this.index = index;
        this.voltage = dataframe._80x08_BatteryVoltage;
        this.dataframe = dataframe;
    }
}

export class Battery {
    constructor(dataframes) {
        this._dataframes = dataframes;
        this._minVoltageDataframe = this._getMinVoltage(dataframes);

        this._firstDataframe = dataframes.at(Constant.FIRST_DATAFRAME);
        this._currentDataframe = dataframes.at(Constant.CURRENT_DATAFRAME);
        this._currentTime = new Date(this._currentDataframe._80x00_Time).getTime();
    }

    isLow() {
        return (this._firstDataframe._80x08_BatteryVoltage < Constant.MIN_BATTERY_VOLTAGE);
    }

    isCharging() {
        // if the current voltage is at or higher than the charged voltage we can assume the alternator is charging
        if (this._currentDataframe._80x08_BatteryVoltage >= Constant.MIN_BATTERY_CHARGING_VOLTAGE) {
            return BATTERY_CHARGING;
        }

        if (this._hasCrankingProfile()) {
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
        // detect a significant voltage drop from the initial battery state
        const highestCrankVoltage = this._firstDataframe._80x08_BatteryVoltage - Constant.MIN_BATTERY_RECOVERY_VOLTAGE;
        return (this._minVoltageDataframe.voltage < highestCrankVoltage);
    }

    _getMinVoltage(dataframes) {
        // find the lowest voltage
        const batteryVoltage = Math.min.apply(Math, dataframes.map(function(df){ return df._80x08_BatteryVoltage; }));
        return this._findDataframe(dataframes, batteryVoltage);
    }

    _findDataframe(dataframes, dataframeToFind) {
        // find the first instance
        const dataframe =  dataframes.find(function(df){ return df._80x08_BatteryVoltage === dataframeToFind; });

        // and where it is in the dataframes array
        const index = dataframes.indexOf(dataframe);

        return new BatteryVoltage(index, dataframe);
    }
}