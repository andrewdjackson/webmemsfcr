import {beforeAll, describe, expect, it} from "@jest/globals";
import {
    createDataframesWithEngineProfile,
    createValidDataframe,
    createWarmIdleEngineProfile,
    createWarmingIdleEngineProfile, EngineProfile
} from "../fixtures/test.fixtures.js";
import {goodMAPProfile} from "../fixtures/map.fixtures.js";
import {getDateTimeString} from "../rosco/mems-dataframe.js";
import {DataframeLog} from "../rosco/mems-dataframe-log.js";

import {Map, MAP_FAULTY, MAP_WORKING} from "./map.js";
import * as Constant from "./analysis-constants.js";
import {Engine} from "./engine.js";

var engineWarm;
var engineWarming;

beforeAll(() => {
    engineWarm = createWarmIdleEngineProfile();
    engineWarming = createWarmingIdleEngineProfile();
});

describe('engine not running', () => {
    it('MAP too high when engine is running', () => {
        const profile = [69,70,71,72,73,74,75,76,77,77,77];
        const dataframes = createDataframesWithMapProfile(goodMAPProfile);

        const map = new Map(engineWarm);
        map.update(dataframes);
        expect(map.isFaulty()).toBe(MAP_FAULTY);
    })

    it('MAP engine is warming', () => {
        const profile = [30,30,30,30,30,30,35,36,30,30];
        const dataframes = createDataframesWithMapProfile(goodMAPProfile);

        const map = new Map(engineWarm);
        map.update(dataframes);
        expect(map.isFaulty()).toBe(MAP_FAULTY);
    })
})

function createDataframesWithMapProfile(mapProfile) {
    let dataframeLog = new DataframeLog();
    const timeNow = new Date().getTime();

    for (let i=0; i < mapProfile.length; i++) {
        let df = createValidDataframe();
        df.df80._80x05_IntakeAirTemp = mapProfile[i].iat;
        df.df80._80x01_EngineRPM = mapProfile[1].rpm;
        df.df80._80x07_ManifoldAbsolutePressure = mapProfile[i].map;
        df.df80._80x00_Time = getDateTimeString(timeNow + (i * 1000)); // dataframes at 1 second intervals
        df.df7d._7Dx00_Time = df.df80._80x00_Time;

        dataframeLog.addDataframe(df.df7d);
        dataframeLog.addDataframe(df.df80);
    }

    return dataframeLog.dataframes;
}
