import { describe, it, expect, beforeAll } from "@jest/globals"
import fetchMock from "jest-fetch-mock";

import {MemsLocalSerialInterface} from "./mems-local-serial.js";
import * as Command from "../../../../app/static/scripts/rosco/mems-1x/mems-commands.js";

let serial;

fetchMock.enableMocks();

beforeAll(() => {
    serial = new MemsLocalSerialInterface();
    fetch.resetMocks();
})

describe('list available serial ports', () => {
    it('list available serial ports', async () => {
        fetch.mockResponseOnce(JSON.stringify({"Ports":[]}));

        await serial.getAvailablePorts().then((ports) => {
            expect(ports.Ports).toBeDefined();
        })
    });
});

describe('connect to serial port', () => {
    it('is connected to a serial port', async () => {
        let port = '/dev/cu.usbserial-AB0MKMTB';
        let connected = false;

        fetch.mockResponseOnce(JSON.stringify({"Connected":true}));

        await serial.connect(port).then((isConnected) => {
            connected = isConnected;
        })

        expect(connected).toBe(true);
    });
});

describe('disconnect from serial port', () => {
    it('is disconnected from the serial port', async () => {
        let connected = false;

        serial._isConnected = true;

        fetch.mockResponseOnce(JSON.stringify({"Connected":false}));
        await serial.disconnect().then((isConnected) => {
            connected = isConnected;
        })

        expect(connected).toBe(false);
    });
});

describe('get a dataframe from serial port', () => {
    it('dataframe is returned from the serial port', async () => {
        let port = '/dev/cu.usbserial-AB0MKMTB';
        let connected = false;

        fetch.mockResponseOnce(JSON.stringify({"Connected":true}));
        await serial.connect(port).then((isConnected) => {
            connected = isConnected;
        })

        expect(connected).toBe(true);

        fetch.mockResponseOnce(JSON.stringify({"Command":"7d","Response":"7d201017ff920058ffff0100806400ff75ffff30807b69ff16401ac022402fc006","ExpectedSize":33}));
        await serial.sendAndReceiveFromSerial(Command.MEMS_Dataframe7d.command, Command.MEMS_Dataframe7d.responseSize).then((response) => {
            expect(response).toHaveLength(Command.MEMS_Dataframe7d.responseSize);
        })
    });
});

