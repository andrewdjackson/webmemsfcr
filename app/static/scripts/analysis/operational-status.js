import * as Constant from "./analysis-constants.js"

const SAMPLE_SIZE = 30;
const CURRENT_DATAFRAME = -1;
const PREVIOUS_DATAFRAME = -2;

export class OperationalStatus {
    constructor(dataframes) {
        this._dataframes = dataframes;
        this._dataframe = dataframes.at(CURRENT_DATAFRAME);
        this._operationalFaults = {};
        this._initialiseFaults();
    }

    get dataframes() {
        return this._dataframes;
    }

    get dataframe() {
        return this._dataframe;
    }

    get operationalFaults() {
        this._operationalFaults._80x03_CoolantTemp = this.isThermostatFaulty;
        this._operationalFaults._80x07_ManifoldAbsolutePressure = this.isMAPHigh;
        this._operationalFaults._80x08_BatteryVoltage  = this.isBatteryVoltageLow;
        this._operationalFaults._80x10_IdleHot = this.isHotIdleFaulty;
        this._operationalFaults._80x12_IACPosition = this.isIACFaulty;
        this._operationalFaults._80x17_CoilTime = this.isCoilFaulty;
        this._operationalFaults._80x19_CrankshaftPositionSensor = this.isCrankshaftSensorFaulty;
        this._operationalFaults._7Dx06_LambdaVoltage = this.isLambdaOutOfRange || this.isLambdaFaulty;
        this._operationalFaults._7Dx09_LambdaStatus = this.isO2SystemFaulty;
        this._operationalFaults._7Dx0F_IdleBasePosition = this.isEngineIdleFaulty || this.isIdleSpeedFaulty;
        this._operationalFaults._7Dx13_IdleSpeedOffset = this.isIACFaulty;
        this._operationalFaults._7Dx1F_JackCount = this.isJackCountHigh;
        this._operationalFaults.CoolantTempSensorFault = this.isCoolantSensorFaulty;
        this._operationalFaults.IntakeAirTempSensorFault = this.isAirIntakeSensorFaulty;
        this._operationalFaults.FuelPumpCircuitFault = this.isFuelPumpCircuitFaulty;
        this._operationalFaults.ThrottlePotCircuitFault = this.isThrottlePotCircuitFaulty;
        this._operationalFaults.ThermostatFaulty = this.isThermostatFaulty;

        //console.info(`operational faults found ${JSON.stringify(this._operationalFaults)}`);

        return this._operationalFaults;
    }

    get isEngineRunning() {
        return (this._dataframe._80x01_EngineRPM > Constant.engineNotRunningRPM);
    }

    //
    // find the time that the engine started, return undefined if the engine has not been started
    //
    get engineStartedAt() {
        // if the engine is running at the start of the run, then return that as the started time
        if (this._dataframes.at(0).isEngineRunning) {
            return new(this._dataframes.at(0)._80x00_Time);
        } else {
            if (this._dataframes.length > 1) {
                let previous = this._dataframes.at(PREVIOUS_DATAFRAME);

                // set the engine start time if we're running now but off in the previous dataframe
                if (this.isEngineRunning && !previous.isEngineRunning) {
                    return new Date(this._dataframe._80x00_Time);
                }
            }
        }

        return undefined;
    }

    get isEngineWarm() {
        return (this._dataframe._80x03_CoolantTemp >= Constant.lowestEngineWarmTemperature);
    }

    //
    // engine is deemed to be at idle if the engine is running and the angle of the throttle pot indicates the throttle is off
    // later MEMS ECUs use the throttle pot to determine the idle position
    //
    get isEngineIdle() {
        return ((this.isEngineRunning) && (this._dataframe._80x09_ThrottlePotSensor <= Constant.defaultIdleThrottlePot));
    }

    get isLoopClosed() {
        return this._dataframe._7Dx0A_ClosedLoop;
    }

    get isThrottleActive() {
        return ((this._dataframe._80x09_ThrottlePotSensor > Constant.defaultIdleThrottlePot) || (this._dataframe._80x01_EngineRPM > Constant.highestIdleRPM));
    }

    get isBatteryVoltageLow() {
        return this._dataframe._80x08_BatteryVoltage < Constant.lowestBatteryVoltage;
    }

    //
    // battery must not be low as this will affect the coil timing
    //
    get isCoilFaulty() {
        if (this.isEngineRunning) {
            return (!this.isBatteryVoltageLow && (this._dataframe._80x17_CoilTime > Constant.highestIdleCoilTime));
        } else {
            return false
        }
    }

    //
    // MAP value should be less than 45kPa when the engine is at idle
    //
    get isMAPHigh() {
        return this.isEngineIdle && (this._dataframe._80x07_ManifoldAbsolutePressure > Constant.highestIdleMAPValue);
    }

    //
    // if the lambda status is 0 and the lambda is not oscillating then ecu is not using the o2 system
    //
    get isO2SystemFaulty() {
        if (this.isEngineRunning) {
            if (this.engineStartedAt !== undefined) {
                const currentTime = new Date(this._dataframe._80x00_Time).getTime();
                const expectedO2ActiveAt = new Date(this.engineStartedAt.getTime() + 90).getTime();
                if (currentTime > expectedO2ActiveAt) {
                    // return true, e.g. faulty if the lambda status is 0
                    return (this._dataframe._7Dx09_LambdaStatus === 0);
                }
            }
        }

        // ignore the lambda status and return no fault
        return false;
    }

    //
    // This is the number of steps from 0 which the ECU will use as guide for starting idle speed control during engine warm up.
    // The value will start at quite a high value (>100 steps) on a very cold engine and fall to < 50 steps on a fully warm engine.
    // A high value on a fully warm engine or a low value on a cold engine will cause poor idle speed control.
    // Idle run line position is calculated by the ECU using the engine coolant temperature sensor.
    //
    get isEngineIdleFaulty() {
         if (this.isEngineIdle) {
            if (this.isEngineWarm) {
                // fault if > 50 when engine is warm
                return this._dataframe._7Dx0F_IdleBasePosition > Constant.highestIdleBasePosition;
            } else {
                // fault if < 50 when engine is cold
                return this._dataframe._7Dx0F_IdleBasePosition < Constant.lowestIdleBasePosition;
            }
        }

        return false
    }

    //
    // fault if idle hot is outside the range of 10 - 50
    //
    get isHotIdleFaulty() {
        if (this.isEngineIdle) {
            if (this.isEngineWarm) {
                return ((this._dataframe._80x10_IdleHot < Constant.minimumIdleHot) || (this._dataframe._80x10_IdleHot > Constant.maximumIdleHot));
            }
        }

        return false
    }

    //
    // Also known as stepper motor idle air control valve (IACV) to control engine idle speed and air flow from cold start up
    // A high number of steps indicates that the ECU is attempting to close the stepper or reduce the airflow
    // a low number would indicate the inability to increase airflow
    // IAC position invalid if the idle offset exceeds the max error, yet the IAC Position remains at 0
    //
    get isIACFaulty() {
        return this.isEngineIdle && (this._dataframe._7Dx13_IdleSpeedOffset > Constant.maximumIdleOffset) && (this._dataframe._80x12_IACPosition === Constant.invalidIACPosition);
    }

    get isLambdaOutOfRange() {
        return this.isEngineRunning && (this._dataframe._7Dx06_LambdaVoltage < Constant.lowestLambdaValue || this._dataframe._7Dx06_LambdaVoltage > Constant.highestLambdaValue);
    }

    get isJackCountHigh() {
        return this._dataframe._7Dx1F_JackCount >= Constant.highestJackCount;
    }

    get isCrankshaftSensorFaulty() {
        return this._dataframe._80x19_CrankshaftPositionSensor === Constant.invalidCASPosition;
    }

    get isThermostatFaulty() {
        if (this.isEngineRunning) {
            const currentTime = new Date(this._dataframe._80x00_Time).getTime();
            const expectedTimeEngineWarm = this._getExpectedEngineWarmTime().getTime();
            return (currentTime > expectedTimeEngineWarm) && (data._80x03_CoolantTemp < Constant.lowestEngineWarmTemperature);
        } else {
            return false
        }
    }

    get isCoolantSensorFaulty() {
        return this._dataframe.CoolantTempSensorFault;
    }

    get isAirIntakeSensorFaulty() {
        return this._dataframe.IntakeAirTempSensorFault;
    }

    get isFuelPumpCircuitFaulty() {
        return this._dataframe.FuelPumpCircuitFault;
    }

    get isThrottlePotCircuitFaulty() {
        return this._dataframe.ThrottlePotCircuitFault;
    }

    get isO2SystemActive() {
        return (this._dataframe._7Dx09_LambdaStatus === 1);
    }

    //
    // idle speed deviation indicates how far away it is from idle target
    // idle base position indicates the target for IAC position
    // a mean value of more than 100 indicates that the ECU is not in control of the idle speed.
    // This indicates a possible fault condition.
    //
    get isIdleSpeedFaulty() {
        if (this.isEngineRunning) {
            let sum = 0;
            let sample = this._dataframes.slice(-SAMPLE_SIZE);

            sample.forEach((item) => {
                sum += item._7Dx0F_IdleBasePosition;
            });
            const mean = sum / sample.length;
            return mean > Constant.highestIdleSpeedDeviation;
        }

        return false
    }

    get isLambdaFaulty() {
        if (this.isEngineRunning) {
            if (this.engineStartedAt !== undefined) {
                const currentTime = new Date(this._dataframe._80x00_Time).getTime();
                const expectedOscillationsAt = new Date(this.engineStartedAt.getTime() + 90).getTime();
                if (currentTime > expectedOscillationsAt) {
                    return !this._isLambdaOscillating();
                }
            }
        }

        // ignore the lambda and return no fault
        return false
    }

    //
    // check if the lambda voltage is oscillating (std dev > 100)
    // need a full dataset for this analysis
    //
    _isLambdaOscillating() {
        if (this.isEngineRunning) {
            // calculate the mean
            let sum = 0;
            this._dataframes.forEach((item) => {
                sum += item._7Dx06_LambdaVoltage;
            });
            const mean = sum / this._dataframes.length;

            // calculate the standard deviation
            let stddev = 0;
            this._dataframes.forEach((item) => {
                stddev += Math.pow(item._7Dx06_LambdaVoltage - mean, 2);
            });

            stddev = Math.sqrt(stddev / (this._dataframes.length - 1));

            return stddev > Constant.lambdaOscillationStandardDeviation;
        }

        return true;
    }

    //
    // the engine warms at around 11 seconds per degree
    // given the current time and coolant temp, the estimated warm time to 80C can be calculated
    //
    _getExpectedEngineWarmTime() {
        let currentTime = new Date(this._dataframe._80x00_Time);
        let degreesToWarm = Constant.engineOperatingTemp - this._dataframe._80x03_CoolantTemp;
        let secondsToWarm = degreesToWarm * Constant.secondsPerDegree;
        return new Date(currentTime.getTime() + secondsToWarm);
    }

    _initialiseFaults() {
        this._operationalFaults._80x03_CoolantTemp = false;
        this._operationalFaults._80x07_ManifoldAbsolutePressure = false;
        this._operationalFaults._80x08_BatteryVoltage = false;
        this._operationalFaults._80x10_IdleHot = false;
        this._operationalFaults._80x12_IACPosition = false;
        this._operationalFaults._80x17_CoilTime = false;
        this._operationalFaults._80x19_CrankshaftPositionSensor = false;
        this._operationalFaults._7Dx06_LambdaVoltage = false;
        this._operationalFaults._7Dx09_LambdaStatus = false;
        this._operationalFaults._7Dx0F_IdleBasePosition = false;
        this._operationalFaults._7Dx13_IdleSpeedOffset = false;
        this._operationalFaults._7Dx1F_JackCount = false;
        this._operationalFaults.CoolantTempSensorFault = false;
        this._operationalFaults.IntakeAirTempSensorFault = false;
        this._operationalFaults.FuelPumpCircuitFault = false;
        this._operationalFaults.ThrottlePotCircuitFault = false;
        this._operationalFaults.ThermostatFaulty = false;
    }
}
