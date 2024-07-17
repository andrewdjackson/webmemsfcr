import {describe, expect, it} from "@jest/globals";

import {createValidDataframe, createDataframesWithEngineProfile, EngineProfile} from "../fixtures/test.fixtures.js";
import * as Constant from "./analysis-constants.js";
import {Engine} from "./engine.js";

const engineNotRunning = new EngineProfile(Constant.ENGINE_NOT_RUNNING,Constant.DEFAULT_IDLE_THROTTLE_POT_VOLTAGE - 0.1, Constant.MIN_ENGINE_OPERATING_TEMPERATURE - 1);
const engineNotRunningWarm = new EngineProfile(Constant.ENGINE_NOT_RUNNING,Constant.DEFAULT_IDLE_THROTTLE_POT_VOLTAGE - 0.1, Constant.ECU_ENGINE_OPERATING_TEMPERATURE + 1);
const engineIdleCold = new EngineProfile(Constant.MAX_IDLE_RPM - 1,Constant.DEFAULT_IDLE_THROTTLE_POT_VOLTAGE - 0.1, Constant.MIN_ENGINE_OPERATING_TEMPERATURE - 1);
const engineIdleWarming = new EngineProfile(Constant.MAX_IDLE_RPM - 1,Constant.DEFAULT_IDLE_THROTTLE_POT_VOLTAGE - 0.1, Constant.MIN_ENGINE_OPERATING_TEMPERATURE - 1);
const engineIdleWarm = new EngineProfile(Constant.MAX_IDLE_RPM - 1,Constant.DEFAULT_IDLE_THROTTLE_POT_VOLTAGE - 0.1, Constant.ECU_ENGINE_OPERATING_TEMPERATURE + 1);

describe('engine cold', () => {
    it('not running', () => {

        const profile = [engineNotRunning, engineNotRunning, engineNotRunning];
        const dataframes = createDataframesWithEngineProfile(profile);

        const engine = new Engine();
        engine.update(dataframes);

        expect(engine.isRunning).toBe(false);
        expect(engine.isIdle).toBe(false);
        expect(engine.isWarm).toBe(false);
        expect(engine.startedAt.index).toBe(-1);
    })

    it('running', () => {
        const profile = [engineIdleCold,engineIdleCold,engineIdleCold];
        const dataframes = createDataframesWithEngineProfile(profile);

        const engine = new Engine();
        engine.update(dataframes);
        expect(engine.isRunning).toBe(true);
        expect(engine.isIdle).toBe(true);
        expect(engine.isWarm).toBe(false);
        expect(engine.startedAt.index).toBe(0);
    })

    it('started during run', () => {
        const profile = [engineNotRunning, engineNotRunning, engineNotRunning, engineIdleCold,engineIdleCold,engineIdleCold];
        const dataframes = createDataframesWithEngineProfile(profile);

        const engine = new Engine();
        engine.update(dataframes);
        expect(engine.isRunning).toBe(true);
        expect(engine.isIdle).toBe(true);
        expect(engine.isWarm).toBe(false);
        expect(engine.startedAt.index).toBe(3);
    })
})

describe('engine warming / warm', () => {
    it('not running', () => {
        const profile = [engineNotRunningWarm, engineNotRunningWarm, engineNotRunningWarm];
        const dataframes = createDataframesWithEngineProfile(profile);

        const engine = new Engine();
        engine.update(dataframes);
        expect(engine.isRunning).toBe(false);
        expect(engine.isIdle).toBe(false);
        expect(engine.isWarm).toBe(true);
        expect(engine.startedAt.index).toBe(-1);
    })

    it('running, warming', () => {
        const profile = [engineIdleCold,engineIdleCold,engineIdleCold,engineIdleWarming];
        const dataframes = createDataframesWithEngineProfile(profile);

        const engine = new Engine();
        engine.update(dataframes);
        expect(engine.isRunning).toBe(true);
        expect(engine.isIdle).toBe(true);
        expect(engine.isWarm).toBe(false);
        expect(engine.startedAt.index).toBe(0);
    })

    it('started during run', () => {
        const profile = [engineNotRunning, engineNotRunning, engineNotRunning, engineIdleCold,engineIdleCold,engineIdleCold,engineIdleWarming];
        const dataframes = createDataframesWithEngineProfile(profile);

        const engine = new Engine();
        engine.update(dataframes);
        expect(engine.isRunning).toBe(true);
        expect(engine.isIdle).toBe(true);
        expect(engine.isWarm).toBe(false);
        expect(engine.startedAt.index).toBe(3);
    })

    it('started during run', () => {
        const profile = [engineNotRunning, engineNotRunning, engineNotRunning, engineIdleCold,engineIdleCold,engineIdleCold,engineIdleWarming, engineIdleWarm];
        const dataframes = createDataframesWithEngineProfile(profile);

        const engine = new Engine();
        engine.update(dataframes);
        expect(engine.isRunning).toBe(true);
        expect(engine.isIdle).toBe(true);
        expect(engine.isWarm).toBe(true);
        expect(engine.startedAt.index).toBe(3);
    })
})

describe('engine not idle', () => {
    it('accelerating', () => {
        let profile = [];

        // increase RPM and throttle pot. voltage for each step
        for (let i = 0; i < 5; i++) {
            let p = engineIdleWarm;
            p.rpm = p.rpm + (i * 100);
            p.throttle = p.throttle + (i * 0.1);
            profile.push(p);
        }

        const dataframes = createDataframesWithEngineProfile(profile);
        const engine = new Engine();
        engine.update(dataframes);
        expect(engine.isRunning).toBe(true);
        expect(engine.isIdle).toBe(false);
        expect(engine.isWarm).toBe(true);
        expect(engine.startedAt.index).toBe(0);
    })
})
