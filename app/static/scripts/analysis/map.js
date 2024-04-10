import * as Constant from "./analysis-constants.js";
import {SensorEvent, Sensor} from "./sensor.js";
import {Engine} from "./engine.js";
import {MAP_ENGINE_NOT_RUNNING} from "./analysis-constants.js";

export const MAP_FAULTY = true;
export const MAP_WORKING = false;

class ExpectedMAPatEngineRPM {
    rpm;
    minMap;
    maxMax;
    constructor(rpm, minMap, maxMap) {
        this.rpm = rpm;
        this.minMap = minMap;
        this.maxMap = maxMap;
    }
}

const expectedMAP = [
    new ExpectedMAPatEngineRPM(   0, 97, 100),
    new ExpectedMAPatEngineRPM( 800, 30, 34),
    new ExpectedMAPatEngineRPM( 900, 32, 34),
    new ExpectedMAPatEngineRPM(1000, 33, 35),
    new ExpectedMAPatEngineRPM(1100, 34, 42),
    new ExpectedMAPatEngineRPM(1200, 36, 41),
    new ExpectedMAPatEngineRPM(1300, 37, 45),
];

export class Map extends Sensor {
    constructor(dataframes, engine) {
        super(dataframes);
        this._engine = engine;
    }

    isFaulty() {
        return !this._isMAPNominal();
    }

    _isMAPNominal() {
        if (this._engine.isRunning) {
            const m = this._getExpectedMAP();
            return (this._currentDataframe._80x07_ManifoldAbsolutePressure < Constant.MAX_MAP_VALUE);
        } else {
            return (this._currentDataframe._80x07_ManifoldAbsolutePressure === Constant.MAP_ENGINE_NOT_RUNNING);
        }
    }

    _getExpectedMAP() {
        for (let i = expectedMAP.length - 1; i > 0;  i--) {
            const maxRPM = expectedMAP[i].rpm;
            const minRPM = expectedMAP[i-1].rpm;

            if ((this._currentDataframe._80x01_EngineRPM >= minRPM) && (this._currentDataframe._80x01_EngineRPM < maxRPM)) {
                return expectedMAP[i];
            }
        }

        return new ExpectedMAPatEngineRPM(1300, 30, 100);
    }
}

