import {describe, expect, it} from "@jest/globals";
import {createValidDataframe} from "../fixtures/test.fixtures.js";
import {getDateTimeString} from "../rosco/mems-dataframe.js";
import {DataframeLog} from "../rosco/mems-dataframe-log.js";
import {Thermostat, THERMOSTAT_FAULTY, THERMOSTAT_WORKING} from "./thermostat.js";

describe('engine below operating temp', () => {
    it('thermostat working', () => {
        const temperatureProfile = [69,70,71,72,73,74,75,76,77,77,77];
        const dataframes = createDataframesWithTemperatureProfile(temperatureProfile);

        const thermostat = new Thermostat(dataframes);
        expect(thermostat.isFaulty()).toBe(THERMOSTAT_WORKING);
    })
})

describe('engine above operating temp', () => {
    it('working thermostat', () => {
        const temperatureProfile = [74,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,76,76,76,76,76,76,76,76,76,76,76,76,76,76,76,76,76,77,77,77,77,77,77,77,77,77,77,77,77,77,77,77,77,77,77,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,81,81,81,80,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,82,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,86,85,85,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,84,84,84,84,84,84,84,84,84,84,83,83,83,83,83,83,83,83,83,83,82,81,81,81,81,81,81,81,81,81,81];
        const dataframes = createDataframesWithTemperatureProfile(temperatureProfile);

        const thermostat = new Thermostat(dataframes);
        expect(thermostat.isFaulty()).toBe(THERMOSTAT_WORKING);
    })

    it('faulty thermostat', () => {
        const temperatureProfile = [74,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,76,76,76,76,76,76,76,76,76,76,76,76,76,76,76,76,76,77,77,77,77,77,77,77,77,77,77,77,77,77,77,77,77,77,77,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,78,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,79,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,80,81,81,81,80,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,81,82,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,83,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,84,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,86,85,85,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,86,87,87,87,87,88,88,88,88,88,88,89,89,89,89,89,89,89,89,89,90,90,90,90,90,90,90,90,91,91,91,91,91,91,91,91,91,91,92,92,92,92,92,92,92,92,92,92,92,92];
        const dataframes = createDataframesWithTemperatureProfile(temperatureProfile);

        const thermostat = new Thermostat(dataframes);
        expect(thermostat.isFaulty()).toBe(THERMOSTAT_FAULTY);
    })
})

function createDataframesWithTemperatureProfile(temperatureProfile) {
    let dataframeLog = new DataframeLog();

    for (let i=0; i < temperatureProfile.length; i++) {
        let df = createValidDataframe();
        df.df80._80x03_CoolantTemp = temperatureProfile[i];
        df.df80._80x00_Time = getDateTimeString(i * 1000); // dataframes at 1 second intervals
        df.df7d._7Dx00_Time = df.df80._80x00_Time;

        dataframeLog.addDataframe(df.df7d);
        dataframeLog.addDataframe(df.df80);
    }

    return dataframeLog.dataframes;
}