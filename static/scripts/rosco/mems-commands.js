import {EventTopic} from "./mems-queue.js";

export class ECUCommand {
    constructor(id, topic, command, responseSize) {
        this.id = id;
        this.topic = topic;
        this.command = command;
        this.responseSize = responseSize;
    }
}

export const MEMS_InitA = new ECUCommand(0, EventTopic.Initialisation, 0xca, 1);
export const MEMS_InitB = new ECUCommand(0, EventTopic.Initialisation, 0x75, 1);
export const MEMS_ECUId = new ECUCommand(0, EventTopic.Initialisation, 0xd0, 5);
export const MEMS_Heartbeat = new ECUCommand(0, EventTopic.Heartbeat, 0xf4, 2);
export const MEMS_Dataframe80 = new ECUCommand(0, EventTopic.Dataframe, 0x80, 29);
export const MEMS_Dataframe7d = new ECUCommand(0, EventTopic.Dataframe, 0x7d, 33);
export const MEMS_ClearFaults = new ECUCommand(0, EventTopic.Reset, 0xcc, 2);
export const MEMS_ResetECU = new ECUCommand(0, EventTopic.Reset, 0xfa, 2);

//export const MEMS_ = new ECUCommand(0, EventTopic, 0x, 2);
//export const MEMS_ = new ECUCommand(0, EventTopic, 0x, 2);

export const Actuator = {
    FuelPump:  "fuelpump",
    PTC:  "ptc",
    AirCon: "aircon",
    PurgeValve: "purgevalve",
    BoostValve: "boostvalve",
    Fan: "fan",
    Fan1: "fan/1",
    Fan2: "fan/2",
    Injectors: "injectors",
    Coil: "coil",
};

export const Adjuster = {
    STFT: "stft",
    LTFT: "ltft",
    IdleDecay: "idledecay",
    IdleSpeed: "idlespeed",
    IgnitionAdvance: "ignitionadvance",
    IAC: "iac",
};

function getDateTimeString(unixtime) {
    let date = new Date();

    if (unixtime !== undefined) {
        date = new Date(unixtime);
    }

    let today = `${date.getFullYear()}-${String(date.getMonth()).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    let time  = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}.${String(date.getMilliseconds()).padStart(3, '0')}`;
    return `${today} ${time}`;
}

export class Dataframe80 {
    constructor() {
        this._80x00_Time = getDateTimeString();
        this._80x01_EngineRPM = 0;
        this._80x03_CoolantTemp = 0;
        this._80x04_AmbientTemp = 0;
        this._80x05_IntakeAirTemp = 0;
        this._80x06_FuelTemp = 0;
        this._80x07_ManifoldAbsolutePressure = 0;
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
    }

    Update(ecuResponse) {
        let data = ecuResponse.response.slice(1);

        this._80x00_Time = getDateTimeString(ecuResponse.command.id);
        this._80x01_EngineRPM = (data[1] << 8) + data[2];
        this._80x03_CoolantTemp = data[3] - 55;
        this._80x04_AmbientTemp = data[4] - 55;
        this._80x05_IntakeAirTemp = data[5] - 55;
        this._80x06_FuelTemp = data[6] - 55;
        this._80x07_ManifoldAbsolutePressure = data[7];
        this._80x08_BatteryVoltage = data[8] / 10;
        this._80x09_ThrottlePotSensor = data[9] * 0.02;
        this._80x0A_IdleSwitch = (data[0x0a] & 0x00001000) >> 3;
        this._80x0B_AirconSwitch = data[0x0b] > 0;
        this._80x0C_ParkNeutralSwitch = data[0x0c] > 0;
        this._80x0F_IdleSetPoint = data[0x0f] * 6.1;
        this._80x10_IdleHot = data[0x10];
        this._80x12_IACPosition = data[0x12];
        this._80x13_IdleSpeedDeviation = (data[0x13] << 8) + data[14];
        this._80x15_IgnitionAdvanceOffset = data[0x15];
        this._80x16_IgnitionAdvance = (data[0x16] / 2) - 24;
        this._80x17_CoilTime =((data[0x17] << 8) + data[0x18]) * 0.002;
        this._80x19_CrankshaftPositionSensor = data[0x19];
        this.CoolantTempSensorFault = ((data[13] >> 0) & 1 ) > 0;
        this.IntakeAirTempSensorFault = ((data[13] >> 2) & 1 ) > 0;
        this.FuelPumpCircuitFault = ((data[14] >> 1) & 3) > 0;
        this.ThrottlePotCircuitFault = ((data[14] >> 7) & 4) > 0;
    }
}

export class Dataframe7d {
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
    }

    Update(ecuResponse) {
        let data = ecuResponse.response.slice(1);

        this._7Dx00_Time = getDateTimeString(ecuResponse.command.id);
        this._7Dx01_IgnitionSwitch = data[1] > 0;
        this._7Dx02_ThrottleAngle = data[2] / 2; // * 0.6?
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
    }
}
