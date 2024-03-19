import {describe, expect, it} from "@jest/globals";
import {Battery, BATTERY_LOW, BATTERY_GOOD, BATTERY_NOT_CHARGING, BATTERY_CHARGING} from "./battery.js";
import {createValidDataframe} from "../fixtures/test.fixtures.js";
import {getDateTimeString} from "../rosco/mems-dataframe.js";
import {DataframeLog} from "../rosco/mems-dataframe-log.js";

describe('battery low, with engine starting', () => {
    it('with no recovery time', () => {
        const batteryProfile = [12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.60, 12.60, 12.60, 12.60, 12.60, 12.60, 12.60, 12.40, 11.80, 11.90, 12.10, 12.40, 12.50];
        const dataframes = createDataframesWithBatteryProfile(batteryProfile);

        const battery = new Battery(dataframes);
        expect(battery.isLow()).toBe(BATTERY_LOW);
        expect(battery.isCharging()).toBe(BATTERY_CHARGING);
    })

    it('alternator not charging', () => {
        const batteryProfile = [12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.60, 12.60, 12.60, 12.60, 12.60, 12.60, 12.60, 12.40, 11.80, 11.90, 12.10, 12.40, 12.50, 12.70, 12.70, 12.70, 12.70, 12.70];
        const dataframes = createDataframesWithBatteryProfile(batteryProfile);

        const battery = new Battery(dataframes);
        expect(battery.isLow()).toBe(BATTERY_LOW);
        expect(battery.isCharging()).toBe(BATTERY_NOT_CHARGING);
    })

    it('alternator is charging', () => {
        const batteryProfile = [12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.70, 12.60, 12.60, 12.60, 12.60, 12.60, 12.60, 12.60, 12.40, 11.80, 11.90, 12.10, 12.40, 12.50, 12.70, 12.80, 12.90, 13.00, 13.10, 13.20, 13.20, 13.20, 13.30, 13.30, 13.30, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40];
        const dataframes = createDataframesWithBatteryProfile(batteryProfile);

        const battery = new Battery(dataframes);
        expect(battery.isLow()).toBe(BATTERY_LOW);
        expect(battery.isCharging()).toBe(BATTERY_CHARGING);
    })
})

describe('battery good, with engine starting', () => {
    it('no recovery time', () => {
        const batteryProfile = [12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.80, 12.80, 12.80, 12.80, 12.80, 12.80, 12.80, 12.60, 11.90, 12.00, 12.20, 12.60, 12.70];
        const dataframes = createDataframesWithBatteryProfile(batteryProfile);

        const battery = new Battery(dataframes);
        expect(battery.isLow()).toBe(BATTERY_GOOD);
        expect(battery.isCharging()).toBe(BATTERY_CHARGING);
    })

    it('alternator not charging', () => {
        const batteryProfile = [12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.80, 12.80, 12.80, 12.80, 12.80, 12.80, 12.80, 12.60, 11.90, 12.00, 12.20, 12.60, 12.70, 12.80, 12.90, 12.90, 12.90, 12.90];
        const dataframes = createDataframesWithBatteryProfile(batteryProfile);

        const battery = new Battery(dataframes);
        expect(battery.isLow()).toBe(BATTERY_GOOD);
        expect(battery.isCharging()).toBe(BATTERY_NOT_CHARGING);
    })

    it('alternator is charging', () => {
        const batteryProfile = [12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.80, 12.80, 12.80, 12.80, 12.80, 12.80, 12.80, 12.60, 11.90, 12.00, 12.20, 12.60, 12.70, 12.80, 12.80, 12.90, 13.00, 13.10, 13.20, 13.20, 13.20, 13.30, 13.30, 13.30, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40];
        const dataframes = createDataframesWithBatteryProfile(batteryProfile);

        const battery = new Battery(dataframes);
        expect(battery.isLow()).toBe(BATTERY_GOOD);
        expect(battery.isCharging()).toBe(BATTERY_CHARGING);
    })
})

describe('battery good, with engine running', () => {
    it('battery fully charged', () => {
        const batteryProfile = [13.20, 13.00, 13.10, 13.20, 13.20, 13.20, 13.30, 13.30, 13.30, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40, 13.40];
        const dataframes = createDataframesWithBatteryProfile(batteryProfile);

        const battery = new Battery(dataframes);
        expect(battery.isLow()).toBe(BATTERY_GOOD);
        expect(battery.isCharging()).toBe(BATTERY_CHARGING);
    })

    it('alternator not charging', () => {
        const batteryProfile = [13.20, 13.00, 13.10, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.90, 12.80, 12.80, 12.80, 12.80, 12.80, 12.80, 12.80, 12.80];
        const dataframes = createDataframesWithBatteryProfile(batteryProfile);

        const battery = new Battery(dataframes);
        expect(battery.isLow()).toBe(BATTERY_GOOD);
        expect(battery.isCharging()).toBe(BATTERY_NOT_CHARGING);
    })
})

function createDataframesWithBatteryProfile(batteryProfile) {
    let dataframeLog = new DataframeLog();

    for (let i=0; i < batteryProfile.length; i++) {
        let df = createValidDataframe();
        df.df80._80x08_BatteryVoltage = batteryProfile[i];
        df.df80._80x00_Time = getDateTimeString(i * 1000); // dataframes at 1 second intervals
        df.df7d._7Dx00_Time = df.df80._80x00_Time;

        dataframeLog.addDataframe(df.df7d);
        dataframeLog.addDataframe(df.df80);
    }

    return dataframeLog.dataframes;
}