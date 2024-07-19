import * as Constant from "./analysis-constants.js";
import {Sensor} from "./sensor.js";

export const MAP_FAULTY = true;
export const MAP_WORKING = false;

export class Map extends Sensor {
    constructor(engine) {
        super();
        this._engine = engine;
        this._faulty = false;
    }

    update(dataframes) {
        super.update(dataframes);
    }

    isFaulty() {
        if (!this._faulty) {
            this._isMAPNominal();
        }

        return this._faulty;
    }

    _isMAPNominal() {
        const start_buffer = 1;
        let expectedMaxMap = Constant.MAX_MAP_VALUE;

        for (let i = 0; i < this._dataframes.length; i++) {
            // engine running
            if (this._dataframes[i]._80x01_EngineRPM > 0) {
                // ignore the first few readings after the engine has just started
                if (i > start_buffer) {
                    if (this._dataframes[i - start_buffer]._80x01_EngineRPM === 0) {
                        break;
                    }
                }
                // check the MAP doesn't exceed expected values
                if (this._dataframes[i]._80x03_CoolantTemp >= Constant.ECU_ENGINE_OPERATING_TEMPERATURE) {
                    expectedMaxMap = Constant.MAX_MAP_WARM_IDLE;
                }

                if (this._dataframes[i]._80x07_ManifoldAbsolutePressure > expectedMaxMap) {
                    this._faulty = true;
                    break;
                }
            } else {
                // expect the MAP to be 100 if not running
                if (this._dataframes[i]._80x07_ManifoldAbsolutePressure !== Constant.MAP_ENGINE_NOT_RUNNING) {
                    this._faulty = true;
                    break;
                }
            }
        }
    }
}

