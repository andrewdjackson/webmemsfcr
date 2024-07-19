import {beforeAll, describe, expect, it} from "@jest/globals";
import {
    createValidDataframe,
    createWarmIdleEngineProfile,
    createWarmingIdleEngineProfile
} from "../fixtures/test.fixtures.js";
import {faultyMAPProfile, workingMAPProfile} from "../fixtures/map.fixtures.js";
import {getDateTimeString} from "../rosco/mems-dataframe.js";
import {DataframeLog} from "../rosco/mems-dataframe-log.js";

import {Map, MAP_FAULTY, MAP_WORKING} from "./map.js";
import {Engine} from "./engine.js";

var engineWarm;
var engineWarming;

beforeAll(() => {
    engineWarm = createWarmIdleEngineProfile();
    engineWarming = createWarmingIdleEngineProfile();
});

describe('MAP sensor', () => {
    it('Vacuum leak, MAP values too high', () => {
        const dataframes = createDataframesWithMapProfile(faultyMAPProfile);

        const engine = new Engine();
        engine.update(dataframes);

        const map = new Map(engine);
        map.update(dataframes);

        expect(map.isFaulty()).toBe(MAP_FAULTY);
    })

    it('No vacuum leak, MAP values as expected', () => {
        const dataframes = createDataframesWithMapProfile(workingMAPProfile);

        const engine = new Engine();
        engine.update(dataframes);

        const map = new Map(engine);
        map.update(dataframes);

        expect(map.isFaulty()).toBe(MAP_WORKING);
    })
})

function createDataframesWithMapProfile(profile) {
    let dataframeLog = new DataframeLog();
    const timeNow = new Date().getTime();

    for (let i=0; i < profile.length; i++) {
        let df = createValidDataframe();
        df.df80._80x01_EngineRPM = profile[i].rpm;
        df.df80._80x07_ManifoldAbsolutePressure = profile[i].map;
        df.df80._80x00_Time = getDateTimeString(timeNow + (i * 1000)); // dataframes at 1 second intervals
        df.df80._80_RawData = "801C06B088FF56FF238721100001000000268859035D006B0524100000";

        df.df7d._7Dx00_Time = df.df80._80x00_Time;
        df.df7d._7D_RawData = "7D201014FF92003EFFFF010180620CFF37FFFF30808373FF16401AC022402FC006";

        dataframeLog.addDataframe(df.df7d);
        dataframeLog.addDataframe(df.df80);
    }

    return dataframeLog.dataframes;
}
