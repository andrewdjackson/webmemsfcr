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

    isSluggish() {
        if (this._isEngineRunning) {
            if (this._currentTime > this._expectOscillationsAt) {
                const oscillationExpectedAtDataframe = this._getOscillationsExpectedAtDataframe();
                const dataframesPostOscillationTime = this._dataframes.slice(oscillationExpectedAtDataframe.index);
                const sample = dataframesPostOscillationTime.map(({_7Dx06_LambdaVoltage }) => _7Dx06_LambdaVoltage);
                const stats = this.analyzeOscillations(sample);
                return !(stats.length < (sample.length / Constant.MAX_VALUES_PER_OSCILLATION));
            }
        }

        // ignore the lambda and return no fault
        return LAMBDA_WORKING;
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
                const oscillationExpectedAtDataframe = this._getOscillationsExpectedAtDataframe();
                const dataframesPreOscillationTime = this._dataframes.slice(0, oscillationExpectedAtDataframe.index);

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
    _isLambdaOscillating(dataframes) {
        const sample = dataframes.map(({_7Dx06_LambdaVoltage }) => _7Dx06_LambdaVoltage);
        const stdDev = this.calculateStandardDeviation(sample);

        return stdDev > Constant.LAMBDA_OSCILLATION_MIN_STDDEV;
    }

    analyzeOscillations(data) {
        const MIN_VALUE = 10;
        const MIN_CHANGE = 50;
        const MIN_DATA_POINTS = 4;

        const oscillations = [];
        let inOscillation = false;
        let oscillationStart = null;
        let oscillationMin = Infinity;
        let oscillationMax = -Infinity;
        let oscillationStartValue = null;

        for (let i = 0; i < data.length; i++) {
            const value = data[i];

            // Ignore values less than MIN_VALUE
            if (value < MIN_VALUE) {
                continue;
            }

            // Check if oscillation has started (rising after initial low)
            if (!inOscillation && i > 0 && value > data[i - 1]) {
                inOscillation = true;
                oscillationStart = i;
                oscillationMin = value;
                oscillationMax = value;
                oscillationStartValue = value; // Store starting value
            }

            // Update min and max values within the oscillation
            if (inOscillation) {
                oscillationMin = Math.min(oscillationMin, value);
                oscillationMax = Math.max(oscillationMax, value);

                // Check for oscillation end (falling below minimum after a peak)
                if (i > oscillationStart + MIN_DATA_POINTS && value < oscillationMin + MIN_CHANGE) {
                    // Check if peak is at least 100 higher than start and end
                    if (oscillationMax >= oscillationStartValue + MIN_CHANGE) {
                        //const standardDeviation = this.calculateStandardDeviation(data.slice(oscillationStart, i + 1));
                        oscillations.push({
                            startIndex: oscillationStart,
                            endIndex: i,
                            minValue: oscillationMin,
                            maxValue: oscillationMax,
                            dataPoints: i - oscillationStart + 1,
                            //standardDeviation,
                        });
                    }
                    inOscillation = false;
                }
            }
        }

        return oscillations;
    }

    calculateStandardDeviation(data) {
        const mean = data.reduce((acc, val) => acc + val, 0) / data.length;
        const squaredDifferences = data.map((val) => Math.pow(val - mean, 2));
        const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / (data.length - 1);
        return Math.sqrt(variance);
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

    _getOscillationsExpectedAtDataframe() {
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