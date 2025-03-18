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
        let ecuResponse80Data = ecuResponse.response.slice(1);

        this._80x00_Time = getDateTimeString();
        this._80x01_EngineRPM = (ecuResponse80Data[1] << 8) + ecuResponse80Data[2];
        this._80x03_CoolantTemp = ecuResponse80Data[3] - 55;
        this._80x04_AmbientTemp = ecuResponse80Data[4] - 55;
        this._80x05_IntakeAirTemp = ecuResponse80Data[5] - 55;
        this._80x06_FuelTemp = ecuResponse80Data[6] - 55;
        this._80x07_ManifoldAbsolutePressure = ecuResponse80Data[7];
        this._80x08_BatteryVoltage = ecuResponse80Data[8] / 10;
        this._80x09_ThrottlePotSensor = ecuResponse80Data[9] * 0.02;  // 0.02V per LSB
        this._80x09_ThrottlePotSensor = roundDecimalPlaces(this._80x09_ThrottlePotSensor);
        this._80x0A_IdleSwitch = (ecuResponse80Data[0x0a] & 0x00001000) >> 3;
        this._80x0B_AirconSwitch = ecuResponse80Data[0x0b] > 0;
        this._80x0C_ParkNeutralSwitch = ecuResponse80Data[0x0c] > 0;
        this._80x0F_IdleSetPoint = ecuResponse80Data[0x0f] * 6.1;
        this._80x0F_IdleSetPoint = roundDecimalPlaces(this._80x0F_IdleSetPoint);
        this._80x10_IdleHot = ecuResponse80Data[0x10];
        this._80x12_IACPosition = ecuResponse80Data[0x12];
        this._80x13_IdleSpeedDeviation = (ecuResponse80Data[0x13] << 8) + ecuResponse80Data[14];
        this._80x15_IgnitionAdvanceOffset = ecuResponse80Data[0x15];
        this._80x16_IgnitionAdvance = (ecuResponse80Data[0x16] / 2) - 24;
        this._80x17_CoilTime = ((ecuResponse80Data[0x17] << 8) + ecuResponse80Data[0x18]) * 0.002;
        this._80x17_CoilTime = roundDecimalPlaces(this._80x17_CoilTime);
        this._80x19_CrankshaftPositionSensor = ecuResponse80Data[0x19];
        this.CoolantTempSensorFault = (ecuResponse80Data[0x0d] & 0x01 ) !== 0;
        this.IntakeAirTempSensorFault = (ecuResponse80Data[0x0d] & 0x02 ) !== 0;
        this.FuelPumpCircuitFault = (ecuResponse80Data[0x0e] & 0x02) !== 0;
        this.ThrottlePotCircuitFault = (ecuResponse80Data[0x0e] & 0x80) !== 0;
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
    //LambdaHeaterRelayFault;
    //CrankshaftSyncFault;
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
        //this.LambdaHeaterRelayFault = false;
        //this.CrankshaftSyncFault = false;
        this._7D_RawData = "";
    }

    updateValuesFromEcuResponse(ecuResponse) {
        let ecuResponse7dData = ecuResponse.response.slice(1);

        this._7Dx00_Time = getDateTimeString();
        this._7Dx01_IgnitionSwitch = ecuResponse7dData[1] > 0;
        this._7Dx02_ThrottleAngle = ecuResponse7dData[2] * 0.6;
        this._7Dx02_ThrottleAngle = roundDecimalPlaces(this._7Dx02_ThrottleAngle)
        this._7Dx04_AirFuelRatio = ecuResponse7dData[4] / 10;
        this._7Dx06_LambdaVoltage = ecuResponse7dData[6] * 5;
        this._7Dx07_LambdaFrequency = ecuResponse7dData[7];
        this._7Dx08_LambdaDutycycle = ecuResponse7dData[8];
        this._7Dx09_LambdaStatus = ecuResponse7dData[9];
        this._7Dx0A_ClosedLoop = ecuResponse7dData[0x0a] > 0;
        this._7Dx0B_LongTermFuelTrim = ecuResponse7dData[0x0b] - 128;
        this._7Dx0C_ShortTermFuelTrim = ecuResponse7dData[0x0c] - 100;
        this._7Dx0D_CarbonCanisterPurgeValve = ecuResponse7dData[0x0d];
        this._7Dx0F_IdleBasePosition = ecuResponse7dData[0x0f];
        this._7Dx12_IgnitionAdvanceOffset = ecuResponse7dData[0x12] - 48;
        this._7Dx13_IdleSpeedOffset = ecuResponse7dData[0x13];
        this._7Dx1F_JackCount = ecuResponse7dData[0x1f];
        this._7D_RawData = arrayAsHexString(ecuResponse.response);
        //this.LambdaHeaterRelayFault = ((ecuResponse7dData[0x05] >> 3) & 1) > 0;
        //this.CrankshaftSyncFault = ((ecuResponse7dData[0x05] >> 4) & 1) > 0;
    }
}

function roundDecimalPlaces(metric) {
    return Math.round(metric * 100) / 100
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
        return (this._80x01_EngineRPM < Constant.MAX_RPM);
    }

    get _isCoolantTempValid() {
        return (this._80x03_CoolantTemp < Constant.MAX_AIR_INTAKE_TEMPERATURE);
    }

    get _isIntakeAirTempValid() {
        return (this._80x05_IntakeAirTemp < Constant.MAX_AIR_INTAKE_TEMPERATURE);
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

    let month = date.getMonth() + 1;
    let today = `${date.getFullYear()}-${String(month).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
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
