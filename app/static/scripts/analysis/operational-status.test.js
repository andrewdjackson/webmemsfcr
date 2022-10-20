import {beforeEach, describe, expect, it, test} from "vitest";
import {Dataframe7d, Dataframe80} from "../rosco/mems-dataframe.js";
import {OperationalStatus} from "./operational-status.js";
import {DataframeLog} from "../rosco/mems-dataframe-log.js";
import * as Constant from "../analysis/analysis-constants.js";

var dataframeLog;
var status;

const FIRST_DATAFRAME = 0;
const LAST_DATAFRAME = -1;

beforeEach(() => {
    dataframeLog = new DataframeLog();
})

//test.skip('skipped test', () => {
    describe('Analyse operational status of a dataframe', () => {
        it('should add a dataframe', () => {
            let df = createValidDataframes();
            addValidDataframeToLog(df[0], df[1]);
            status = new OperationalStatus(dataframeLog.dataframes);
            expect(status.isMAPHigh).toBe(false);
        })

        it('should add 2 dataframes to the log', () => {
            for (let i = 0; i < 2; i++) {
                let df = createValidDataframes();
                addValidDataframeToLog(df[0], df[1]);
            }

            status = new OperationalStatus(dataframeLog.dataframes);
            expect(status.isMAPHigh).toBe(false);
        })
    })

    describe('Validate engine operational metrics', () => {
        it('engine has started during run', () => {
            let df;
            df = createValidDataframes(false, false, false);
            addValidDataframeToLog(df[0], df[1]);
            df = createValidDataframes(false, false, false);
            addValidDataframeToLog(df[0], df[1]);
            df = createValidDataframes(true, true, false);
            addValidDataframeToLog(df[0], df[1]);

            status = new OperationalStatus(dataframeLog.dataframes);
            expect(status.engineStartedAt.getTime()).toBe(new Date(dataframeLog.dataframes.at(LAST_DATAFRAME)._80x00_Time).getTime());
        })

        it('engine already running', () => {
            let df;
            df = createValidDataframes(true, false, false);
            addValidDataframeToLog(df[0], df[1]);
            df = createValidDataframes(true, false, false);
            addValidDataframeToLog(df[0], df[1]);
            df = createValidDataframes(true, true, false);
            addValidDataframeToLog(df[0], df[1]);

            status = new OperationalStatus(dataframeLog.dataframes);
            expect(status.engineStartedAt.getTime()).toBe(new Date(dataframeLog.dataframes.at(FIRST_DATAFRAME)._80x00_Time).getTime());
        })
    })

    describe('Validate idle operational metrics', () => {
        it('engine is idle', () => {
            let df;
            df = createValidDataframes(true, false, false);
            addValidDataframeToLog(df[0], df[1]);
            df = createValidDataframes(true, false, false);
            addValidDataframeToLog(df[0], df[1]);
            df = createValidDataframes(true, true, false);
            addValidDataframeToLog(df[0], df[1]);

            status = new OperationalStatus(dataframeLog.dataframes);
            expect(status.isEngineIdle).toBe(true);
        })

        it('engine is idle', () => {
            let df;
            df = createValidDataframes(true, false, false);
            addValidDataframeToLog(df[0], df[1]);
            df = createValidDataframes(true, false, false);
            addValidDataframeToLog(df[0], df[1]);
            df = createValidDataframes(true, false, false);
            addValidDataframeToLog(df[0], df[1]);

            status = new OperationalStatus(dataframeLog.dataframes);
            expect(status.isEngineIdle).toBe(false);
        })
    })
//})

describe('Faults', () => {
    it('engine hot idle is faulty', () => {
        let df = createValidDataframes(true, true,true);
        df[0]._80x10_IdleHot = Constant.minimumIdleHot - 1;
        addValidDataframeToLog(df[0],df[1]);

        df = createValidDataframes(true, true,true);
        df[0]._80x10_IdleHot = Constant.minimumIdleHot - 1;
        addValidDataframeToLog(df[0],df[1]);

        status = new OperationalStatus(dataframeLog.dataframes);
        expect(status.isHotIdleFaulty).toBeTruthy();
        expect(status.faults._80x10_IdleHot).toBeTruthy();
    })
})

const warmIdle = 850;
const coldIdle = 1150;
const coolantWarm = Constant.engineOperatingTemp;
const coolantCold = 20;
const goodIntake = 20;
const goodBattery = Constant.lowestBatteryVoltage + 0.5;
const poorBattery = Constant.lowestBatteryVoltage - 0.5;
const idleThrottleAngle = Constant.defaultIdleThrottleAngle;
const revThrottleAngle = Constant.defaultIdleThrottleAngle + 1000;
const goodCoil = Constant.highestIdleCoilTime - 0.5;
const goodCTS = Constant.invalidCASPosition + 1;
const idleMAP = Constant.highestIdleMAPValue - 1;
const runningMAP = Constant.highestIdleMAPValue - 10;
const offMAP = 100;

function addValidDataframeToLog(df80, df7d) {
    dataframeLog.addDataframe(df80);
    dataframeLog.addDataframe(df7d);
}

function createValidDataframes(isRunning, isIdle, isWarm) {
    let dataframe80 = new Dataframe80();
    let dataframe7d = new Dataframe7d();

    if (isWarm) {
        dataframe80._80x03_CoolantTemp = coolantWarm;
        dataframe80._80x01_EngineRPM = warmIdle;
    } else {
        dataframe80._80x03_CoolantTemp = coolantCold;
        dataframe80._80x01_EngineRPM = coldIdle;
    }

    if (isIdle) {
        dataframe80._80x0A_IdleSwitch = true;
        dataframe80._80x07_ManifoldAbsolutePressure = idleMAP;
        dataframe7d._7Dx02_ThrottleAngle = idleThrottleAngle;
    } else {
        dataframe80._80x07_ManifoldAbsolutePressure = runningMAP;
        dataframe7d._7Dx02_ThrottleAngle = revThrottleAngle;
    }

    if (!isRunning) {
        dataframe80._80x01_EngineRPM = 0;
        dataframe80._80x07_ManifoldAbsolutePressure = offMAP;
    }

    dataframe80._80x05_IntakeAirTemp = goodIntake;
    dataframe80._80x08_BatteryVoltage = goodBattery;
    dataframe80._80x0F_IdleSetPoint = 0;
    dataframe80._80x10_IdleHot = Constant.minimumIdleHot;
    dataframe80._80x12_IACPosition = goodCTS;
    dataframe80._80x13_IdleSpeedDeviation = Constant.highestIdleSpeedDeviation;
    dataframe80._80x17_CoilTime = goodCoil;
    dataframe80._80x19_CrankshaftPositionSensor = Constant.invalidCASPosition + 1;
    dataframe80._7Dx13_IdleSpeedOffset = Constant.maximumIdleOffset;

    return [dataframe80, dataframe7d];
}

