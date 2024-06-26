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
            let df7d = createValidDataframe7D();
            dataframeLog.addDataframe(df7d);
        }
        expect(dataframeLog.hasLoggedData).toBe(true);
        expect(dataframeLog.dataframes).toHaveLength(MIN_DATAFRAMES);
    })

    it('should add 2 valid dataframes and skip 2 invalid dataframes', () => {
        for (let i = 0; i < MIN_DATAFRAMES; i++) {
            let df80 = createValidDataframe80();
            dataframeLog.addDataframe(df80);
            let df7d = createValidDataframe7D();
            dataframeLog.addDataframe(df7d);
        }
        expect(dataframeLog.hasLoggedData).toBe(true);
        expect(dataframeLog.dataframes).toHaveLength(MIN_DATAFRAMES);

        for (let i = 0; i < MIN_DATAFRAMES; i++) {
            let df80 = createValidDataframe80();
            dataframeLog.addDataframe(df80);
            let df7d = new Dataframe7d();
            dataframeLog.addDataframe(df7d);
        }
        expect(dataframeLog.hasLoggedData).toBe(true);
        expect(dataframeLog.dataframes).toHaveLength(MIN_DATAFRAMES);
    })

})

function createValidDataframe80() {
    let df = new Dataframe80();
    df._80x07_ManifoldAbsolutePressure = 34;
    df._80_RawData = "801C000072FF61FF638027001001020000288473043300380B16000000"
    return df;
}

function createValidDataframe7D() {
    let df = new Dataframe7d();
    df._7Dx06_LambdaVoltage = 435;
    df._7D_RawData = "7D201014FF92005CFFFF01009E6400FF55FFFF30807BCDFF1A80200027C035C00B"
    return df;
}
