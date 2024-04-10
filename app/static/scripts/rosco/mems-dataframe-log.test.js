import {beforeEach, describe, expect, it} from "@jest/globals";
import {Dataframe7d, Dataframe80} from "./mems-dataframe";
import {DataframeLog} from "./mems-dataframe-log";

const MIN_DATAFRAMES = 2;
var dataframeLog;

beforeEach(() => {
    dataframeLog = new DataframeLog();
})

describe('Log MEMS 1.3 dataframes', () => {
    it('should add 2 0x80 dataframes to the log', () => {

        // note the first dataframe added for a 1.3 is not added
        for (let i = 0; i <= MIN_DATAFRAMES; i++) {
            let df = createValidDataframe80();
            dataframeLog.addDataframe(df);
        }
        expect(dataframeLog.hasLoggedData).toBe(true);
        // MEMS 1.3 dataframe log will always have one less as we don't know it's a 1.3 until
        // we get the second dataframe
        expect(dataframeLog.dataframes).toHaveLength(MIN_DATAFRAMES);
    })
})

describe('Log MEMS 1.6 dataframes', () => {
    it('should add 2 0x80 / 0x7d dataframes to the log', () => {
        for (let i = 0; i < MIN_DATAFRAMES; i++) {
            let df80 = createValidDataframe80();
            dataframeLog.addDataframe(df80);
            let df7d = new Dataframe7d();
            dataframeLog.addDataframe(df7d);
        }
        expect(dataframeLog.hasLoggedData).toBe(true);
        expect(dataframeLog.dataframes).toHaveLength(MIN_DATAFRAMES);
    })

    it('should add 2 0x80 / 0x7d dataframes to the log', () => {
        for (let i = 0; i < MIN_DATAFRAMES; i++) {
            let df80 = createValidDataframe80();
            dataframeLog.addDataframe(df80);
            let df7d = new Dataframe7d();
            dataframeLog.addDataframe(df7d);
        }

        for (let i = 0; i < MIN_DATAFRAMES; i++) {
            let df80 = createValidDataframe80();
            dataframeLog.addDataframe(df80);
            let df7d = new Dataframe7d();
            df7d._7D_RawData = '';
            dataframeLog.addDataframe(df7d);
        }

        expect(dataframeLog.hasLoggedData).toBe(true);
        expect(dataframeLog.dataframes).toHaveLength(MIN_DATAFRAMES);
    })
})

function createValidDataframe80() {
    let df = new Dataframe80();
    df._80x07_ManifoldAbsolutePressure = 34;
    return df;
}
