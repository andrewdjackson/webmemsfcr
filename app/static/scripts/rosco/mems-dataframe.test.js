import {describe, it, expect} from "@jest/globals";
import {Dataframe, Dataframe7d, Dataframe80} from "./mems-dataframe";

describe('MEMS Dataframes', () => {
    it('should create a dataframe', () => {
        let df = new Dataframe();
        expect(df.CoolantTempSensorFault).toBe(false);
        expect(df._7Dx0A_ClosedLoop).toBe(false);
    })

    it('should update a dataframe', () => {
        let df = new Dataframe();
        let df80 = new Dataframe80();
        df80.CoolantTempSensorFault = true;

        df.update(df80);
        expect(df.CoolantTempSensorFault).toBe(true);
    })

    it('should merge a dataframe', () => {
        let df = new Dataframe();
        let df80 = new Dataframe80();
        let df7d = new Dataframe7d();

        df80.CoolantTempSensorFault = true;
        df7d._7Dx0A_ClosedLoop = true;

        df.merge(df80, df7d);

        expect(df.CoolantTempSensorFault).toBe(true);
        expect(df._7Dx0A_ClosedLoop).toBe(true);
    })
})
