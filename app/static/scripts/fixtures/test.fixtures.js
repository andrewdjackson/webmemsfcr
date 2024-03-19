import {Dataframe7d, Dataframe80} from "../rosco/mems-dataframe.js";

export function createValidDataframe() {
    let df7d = new Dataframe7d();
    let df80 = new Dataframe80();

    df7d._7Dx01_IgnitionSwitch = true
    df7d._7Dx02_ThrottleAngle = 12
    df7d._7Dx04_AirFuelRatio = 14.6
    df7d._7Dx06_LambdaVoltage = 310
    df7d._7Dx07_LambdaFrequency = 255
    df7d._7Dx08_LambdaDutycycle = 255
    df7d._7Dx09_LambdaStatus = 1
    df7d._7Dx0A_ClosedLoop = true
    df7d._7Dx0B_LongTermFuelTrim = 0
    df7d._7Dx0C_ShortTermFuelTrim = -2
    df7d._7Dx0D_CarbonCanisterPurgeValve = 12
    df7d._7Dx0F_IdleBasePosition = 55
    df7d._7Dx12_IgnitionAdvanceOffset = 0
    df7d._7Dx13_IdleSpeedOffset = 128
    df7d._7Dx1F_JackCount = 6
    df7d._7D_RawData = "7D201014FF92003EFFFF010180620CFF37FFFF30808373FF16401AC022402FC006"

    df80._80x01_EngineRPM = 1727
    df80._80x03_CoolantTemp = 80
    df80._80x04_AmbientTemp = 200
    df80._80x05_IntakeAirTemp = 31
    df80._80x06_FuelTemp = 200
    df80._80x07_ManifoldAbsolutePressure = 36
    df80._80x08_BatteryVoltage = 13.5
    df80._80x09_ThrottlePotSensor = 0.7
    df80._80x0A_IdleSwitch = 0
    df80._80x0B_AirconSwitch = false
    df80._80x0C_ParkNeutralSwitch = true
    df80._80x0F_IdleSetPoint = 0
    df80._80x10_IdleHot = 38
    df80._80x12_IACPosition = 91
    df80._80x13_IdleSpeedDeviation = 768
    df80._80x15_IgnitionAdvanceOffset = 0
    df80._80x16_IgnitionAdvance = 30.5
    df80._80x17_CoilTime = 2.64
    df80._80x19_CrankshaftPositionSensor = 16
    df80._80_RawData = "801C06BF87FF56FF24872310000100000026885B036A006D0528100000"

    return {"df7d":df7d, "df80":df80}
}