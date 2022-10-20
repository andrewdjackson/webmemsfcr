import {beforeEach, describe, expect, it} from "vitest";
import {Dataframe7d, Dataframe80} from "../rosco/mems-dataframe.js";
import {DataframeLog} from "../rosco/mems-dataframe-log.js";
import {Analysis} from "./analysis";

const MIN_DATAFRAMES = 3;
var dataframeLog;
var analysis;


beforeEach(() => {
    dataframeLog = new DataframeLog();
    analysis = new Analysis(dataframeLog);
})

describe('Analyse dataframes ', () => {
    it('should add dataframes', () => {
        for (let i=0; i < MIN_DATAFRAMES; i++) {
            let df80 = createValidDataframe80();
            dataframeLog.addDataframe(df80);
            let df7d = new Dataframe7d();
            dataframeLog.addDataframe(df7d);
        }

        analysis.analyse();
        expect(analysis.status).toHaveLength(1);
        expect(analysis.status.at(-1).isMAPHigh).toBeFalsy();
    })
})

function createValidDataframe80() {
    let df = new Dataframe80();
    df._80x07_ManifoldAbsolutePressure = 34;
    return df;
}
