import * as Constant from "../analysis/analysis-constants.js";

export class Dataframe80 {
    _80x00_Time;
    _80x01_EngineRPM;
    _80x03_CoolantTemp;
    _80x04_AmbientTemp;
    _80x05_IntakeAirTemp;
    _80x06_FuelTemp;
    _80x07_ManifoldAbsolutePressure;
    _80x08_BatteryVoltage;
    _80x09_ThrottlePotSensor;
    _80x0A_IdleSwitch;
    _80x0B_AirconSwitch;
    _80x0C_ParkNeutralSwitch;
    _80x0F_IdleSetPoint;
    _80x10_IdleHot;
    _80x12_IACPosition;
    _80x13_IdleSpeedDeviation;
    _80x15_IgnitionAdvanceOffset;
    _80x16_IgnitionAdvance;
    _80x17_CoilTime;
    _80x19_CrankshaftPositionSensor;
    CoolantTempSensorFault;
    IntakeAirTempSensorFault;
    FuelPumpCircuitFault;
    ThrottlePotCircuitFault;
    _80_RawData;

    constructor() {
        this._80x00_Time = getDateTimeString();
        this._80x01_EngineRPM = 0;
        this._80x03_CoolantTemp = 0;
        this._80x04_AmbientTemp = 0;
        this._80x05_IntakeAirTemp = 0;
        this._80x06_FuelTemp = 0;
        this._80x07_ManifoldAbsolutePressure = 1;
        this._80x08_BatteryVoltage = 0;
        this._80x09_ThrottlePotSensor = 0.0;
        this._80x0A_IdleSwitch = false;
        this._80x0B_AirconSwitch = false;
        this._80x0C_ParkNeutralSwitch = false;
        this._80x0F_IdleSetPoint = 0;
        this._80x10_IdleHot = 0;
        this._80x12_IACPosition = 0;
        this._80x13_IdleSpeedDeviation = 0;
        this._80x15_IgnitionAdvanceOffset = 0;
        this._80x16_IgnitionAdvance = 0;
        this._80x17_CoilTime = 0;
        this._80x19_CrankshaftPositionSensor = 0;
        this.CoolantTempSensorFault = false;
        this.IntakeAirTempSensorFault = false;
        this.FuelPumpCircuitFault = false;
        this.ThrottlePotCircuitFault = false;
        this._80_RawData = "";
    }

    updateValuesFromEcuResponse(ecuResponse) {
        let data = ecuResponse.response.slice(1);

        this._80x00_Time = getDateTimeString(ecuResponse.command.id);
        this._80x01_EngineRPM = (data[1] << 8) + data[2];
        this._80x03_CoolantTemp = data[3] - 55;
        this._80x04_AmbientTemp = data[4] - 55;
        this._80x05_IntakeAirTemp = data[5] - 55;
        this._80x06_FuelTemp = data[6] - 55;
        this._80x07_ManifoldAbsolutePressure = data[7];
        this._80x08_BatteryVoltage = data[8] / 10;
        this._80x09_ThrottlePotSensor = data[9] * 0.02;  // 0.02V per LSB
        this._80x0A_IdleSwitch = (data[0x0a] & 0x00001000) >> 3;
        this._80x0B_AirconSwitch = data[0x0b] > 0;
        this._80x0C_ParkNeutralSwitch = data[0x0c] > 0;
        this._80x0F_IdleSetPoint = data[0x0f] * 6.1;
        this._80x10_IdleHot = data[0x10];
        this._80x12_IACPosition = data[0x12];
        this._80x13_IdleSpeedDeviation = (data[0x13] << 8) + data[14];
        this._80x15_IgnitionAdvanceOffset = data[0x15];
        this._80x16_IgnitionAdvance = (data[0x16] / 2) - 24;
        this._80x17_CoilTime = ((data[0x17] << 8) + data[0x18]) * 0.002;
        // round to 2 decimal place
        this._80x17_CoilTime = Math.round(this._80x17_CoilTime * 100) / 100
        this._80x19_CrankshaftPositionSensor = data[0x19];
        this.CoolantTempSensorFault = ((data[13] >> 0) & 1 ) > 0;
        this.IntakeAirTempSensorFault = ((data[13] >> 2) & 1 ) > 0;
        this.FuelPumpCircuitFault = ((data[14] >> 1) & 3) > 0;
        this.ThrottlePotCircuitFault = ((data[14] >> 7) & 4) > 0;
        this._80_RawData = arrayAsHexString(ecuResponse.response);
    }
}

export class Dataframe7d {
    _7Dx00_Time;
    _7Dx01_IgnitionSwitch;
    _7Dx02_ThrottleAngle;
    _7Dx04_AirFuelRatio;
    _7Dx06_LambdaVoltage;
    _7Dx07_LambdaFrequency;
    _7Dx08_LambdaDutycycle;
    _7Dx09_LambdaStatus;
    _7Dx0A_ClosedLoop;
    _7Dx0B_LongTermFuelTrim;
    _7Dx0C_ShortTermFuelTrim;
    _7Dx0D_CarbonCanisterPurgeValve;
    _7Dx0F_IdleBasePosition;
    _7Dx12_IgnitionAdvanceOffset;
    _7Dx13_IdleSpeedOffset;
    _7Dx1F_JackCount;
    _7D_RawData;

    constructor() {
        this._7Dx00_Time = getDateTimeString();
        this._7Dx01_IgnitionSwitch = 0;
        this._7Dx02_ThrottleAngle = 0;
        this._7Dx04_AirFuelRatio = 0;
        this._7Dx06_LambdaVoltage = 0;
        this._7Dx07_LambdaFrequency = 0;
        this._7Dx08_LambdaDutycycle = 0;
        this._7Dx09_LambdaStatus = 0;
        this._7Dx0A_ClosedLoop = false;
        this._7Dx0B_LongTermFuelTrim = 0;
        this._7Dx0C_ShortTermFuelTrim = 0;
        this._7Dx0D_CarbonCanisterPurgeValve = 0;
        this._7Dx0F_IdleBasePosition = 0;
        this._7Dx12_IgnitionAdvanceOffset = 0;
        this._7Dx13_IdleSpeedOffset = 0;
        this._7Dx1F_JackCount = 0;
        this._7D_RawData = "";
    }

    updateValuesFromEcuResponse(ecuResponse) {
        let data = ecuResponse.response.slice(1);

        this._7Dx00_Time = getDateTimeString(ecuResponse.command.id);
        this._7Dx01_IgnitionSwitch = data[1] > 0;
        this._7Dx02_ThrottleAngle = data[2] * 0.6;
        // round to 2 decimal places
        this._7Dx02_ThrottleAngle = Math.round(this._7Dx02_ThrottleAngle * 100) / 100
        this._7Dx04_AirFuelRatio = data[4] / 10;
        this._7Dx06_LambdaVoltage = data[6] * 5;
        this._7Dx07_LambdaFrequency = data[7];
        this._7Dx08_LambdaDutycycle = data[8];
        this._7Dx09_LambdaStatus = data[9];
        this._7Dx0A_ClosedLoop = data[0x0a] > 0;
        this._7Dx0B_LongTermFuelTrim = data[0x0b] - 128;
        this._7Dx0C_ShortTermFuelTrim = data[0x0c] - 100;
        this._7Dx0D_CarbonCanisterPurgeValve = data[0x0d];
        this._7Dx0F_IdleBasePosition = data[0x0f];
        this._7Dx12_IgnitionAdvanceOffset = data[0x12] - 48;
        this._7Dx13_IdleSpeedOffset = data[0x13];
        this._7Dx1F_JackCount = data[0x1f];
        this._7D_RawData = arrayAsHexString(ecuResponse.response);
    }
}

export class Dataframe {
    _80x00_Time;
    _80x01_EngineRPM;
    _80x03_CoolantTemp;
    _80x04_AmbientTemp;
    _80x05_IntakeAirTemp;
    _80x06_FuelTemp;
    _80x07_ManifoldAbsolutePressure;
    _80x08_BatteryVoltage;
    _80x09_ThrottlePotSensor;
    _80x0A_IdleSwitch;
    _80x0B_AirconSwitch;
    _80x0C_ParkNeutralSwitch;
    _80x0F_IdleSetPoint;
    _80x10_IdleHot;
    _80x12_IACPosition;
    _80x13_IdleSpeedDeviation;
    _80x15_IgnitionAdvanceOffset;
    _80x16_IgnitionAdvance;
    _80x17_CoilTime;
    _80x19_CrankshaftPositionSensor;
    CoolantTempSensorFault;
    IntakeAirTempSensorFault;
    FuelPumpCircuitFault;
    ThrottlePotCircuitFault;
    _80_RawData;
    _7Dx01_IgnitionSwitch;
    _7Dx02_ThrottleAngle;
    _7Dx04_AirFuelRatio;
    _7Dx06_LambdaVoltage;
    _7Dx07_LambdaFrequency;
    _7Dx08_LambdaDutycycle;
    _7Dx09_LambdaStatus;
    _7Dx0A_ClosedLoop;
    _7Dx0B_LongTermFuelTrim;
    _7Dx0C_ShortTermFuelTrim;
    _7Dx0D_CarbonCanisterPurgeValve;
    _7Dx0F_IdleBasePosition;
    _7Dx12_IgnitionAdvanceOffset;
    _7Dx13_IdleSpeedOffset;
    _7Dx1F_JackCount;
    _7D_RawData;

    constructor(dataframe80, dataframe7d) {
        if (dataframe80 === undefined) {
            dataframe80 = new Dataframe80();
        }

        if (dataframe7d === undefined) {
            dataframe7d = new Dataframe7d()
        }

        this.merge(dataframe80, dataframe7d);
    }

    merge(dataframe80, dataframe7d) {
        let df = {...dataframe80, ...dataframe7d};
        this.update(df);
    }

    update(dataframe) {
        Object.entries(dataframe).forEach(([key, value]) => {
            this[key] = value;
        })
    }

    isValid() {
        return this._isEngineRPMValid &&
            this._isCoolantTempValid &&
            this._isIntakeAirTempValid &&
            this._isMAPValid
    }

    get _isEngineRPMValid()  {
        return (this._80x01_EngineRPM < Constant.maximumEngineRPM);
    }

    get _isCoolantTempValid() {
        return (this._80x03_CoolantTemp < Constant.maximumAirIntakeTemperature);
    }

    get _isIntakeAirTempValid() {
        return (this._80x05_IntakeAirTemp < Constant.maximumAirIntakeTemperature);
    }

    get _isMAPValid() {
        return (this._80x07_ManifoldAbsolutePressure > 0);
    }
}

export function getDateTimeString(unixtime) {
    let date = new Date();

    if (unixtime !== undefined) {
        date = new Date(unixtime);
    }

    let today = `${date.getFullYear()}-${String(date.getMonth()).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    let time  = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}.${String(date.getMilliseconds()).padStart(3, '0')}`;
    return `${today} ${time}`;
}

//
// convert bytes into a hex string
//
export function arrayAsHexString(data) {
    let hex = "";

    data.forEach(value => {
        hex += value.toString(16).padStart(2, '0');
    });

    return hex.toUpperCase();
}
