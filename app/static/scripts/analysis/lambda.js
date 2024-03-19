import * as Constant from "./analysis-constants.js";

export const LAMBDA_FAULTY = false;
export const LAMBDA_WORKING = true;
export const LAMBDA_HEATER_FAULTY = true;
export const LAMBDA_HEATER_WORKING = false;

class EventDataframe {
    index;
    startedAt;
    dataframe;

    constructor(index, dataframe) {
        this.index = index;
        this.dataframe = dataframe;
        this.startedAt = new Date(this.dataframe._80x00_Time).getTime();
    }
}

export class Lambda {
    constructor(dataframes) {
        this._dataframes = dataframes;
        this._currentDataframe = dataframes.at(Constant.CURRENT_DATAFRAME);
        this._currentTime = new Date(this._currentDataframe._80x00_Time).getTime();
        this._engineStartedAtDataframe = this._getEngineStartedDataframe();
    }

    isLambdaActive() {
        // faulty if the lambda status is 0
        return (this._currentDataframe._7Dx09_LambdaStatus > 0);
    }

    isOutOfRange() {
        return this._isEngineRunning && (this._currentDataframe._7Dx06_LambdaVoltage < Constant.MIN_LAMBDA_VOLTAGE || this._currentDataframe._7Dx06_LambdaVoltage > Constant.MAX_LAMBDA_VOLTAGE);
    }

    isOscillating() {
        if (this._isEngineRunning) {
            if (this._currentTime > this._expectOscillationsAt) {
                if (this.isLambdaActive()) {
                    return this._isLambdaOscillating(this._dataframes);
                } else {
                    // lambda is not being used by the ECU and is operating in open state
                    return LAMBDA_FAULTY;
                }
            }
        }

        // ignore the lambda and return no fault
        return LAMBDA_WORKING;
    }

    isHeaterFaulty() {
        if (this._isEngineRunning) {
            if (this._currentTime > this._expectOscillationsAt) {
                const oscillationStartDataframe = this._getOscillationsStartedDataframe();
                const dataframesPreOscillationTime = this._dataframes.slice(0, oscillationStartDataframe.index);

                if (!this._isLambdaOscillating(dataframesPreOscillationTime)) {
                    return LAMBDA_HEATER_FAULTY;
                }
            }
        }

        // ignore the lambda and return no fault
        return LAMBDA_HEATER_WORKING;
    }

    //
    // check if the lambda voltage is oscillating (std dev > 100)
    // need a full dataset for this analysis
    //
    _isLambdaOscillating(sample) {
        // calculate the mean
        let sum = 0;
        sample.forEach((item) => {
            sum += item._7Dx06_LambdaVoltage;
        });
        const mean = sum / sample.length;

        // calculate the standard deviation
        let stddev = 0;
        sample.forEach((item) => {
            stddev += Math.pow(item._7Dx06_LambdaVoltage - mean, 2);
        });

        stddev = Math.sqrt(stddev / (sample.length - 1));

        return stddev > Constant.LAMBDA_OSCILLATION_MIN_STDDEV;
    }

    get _isEngineRunning() {
        return (this._dataframes[this._engineStartedAtDataframe.index]._80x01_EngineRPM > Constant.ENGINE_NOT_RUNNING);
    }

    //
    // find the time that the engine started, return undefined if the engine has not been started
    //
   _getEngineStartedDataframe() {
       const dataframe = this._dataframes.find(function (df) {
           return df._80x01_EngineRPM > Constant.ENGINE_NOT_RUNNING;
       });

       // and where it is in the dataframes array
       const index = this._dataframes.indexOf(dataframe);

       return new EventDataframe(index, dataframe);
   }

    _getOscillationsStartedDataframe() {
        let expected= new Date(this._engineStartedAtDataframe.startedAt);
        expected.setSeconds(expected.getSeconds() + Constant.LAMBDA_WARMUP_TIME_IN_SECONDS);

        const dataframe = this._dataframes.find(function (df) {
            const dfTime = new Date(df._80x00_Time).getTime();
            return  dfTime > expected.getTime();
        });

        // and where it is in the dataframes array
        const index = this._dataframes.indexOf(dataframe);

        return new EventDataframe(index, dataframe);
    }

    get _expectOscillationsAt() {
        let expected= new Date(this._engineStartedAtDataframe.startedAt);
        expected.setSeconds(expected.getSeconds() + Constant.LAMBDA_WARMUP_TIME_IN_SECONDS);
        return expected.getTime();
    }
}