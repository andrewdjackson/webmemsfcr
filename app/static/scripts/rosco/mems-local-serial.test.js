import { describe, it, expect, beforeAll } from 'vitest'
import {MemsLocalSerialInterface} from "./mems-local-serial.js";
import * as Command from "./mems-commands.js";
import {MEMS_CoolantGauge_Activate, MEMS_STFT_Dec} from "./mems-commands.js";

let serial;

beforeAll(() => {
    serial = new MemsLocalSerialInterface();
})

describe('list available serial ports', () => {
    it('list available serial ports', async () => {
        let availablePorts = [];

        await serial.getAvailablePorts().then((ports) => {
            availablePorts = ports.Ports;
        })

        expect(parseInt(availablePorts.length)).greaterThanOrEqual(1);
    });
});

describe('connect to serial port', () => {
    it('is connected to a serial port', async () => {
        let port = '/dev/cu.usbserial-AB0MKMTB';
        let connected = false;

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

        await serial.connect(port).then((isConnected) => {
            connected = isConnected;
        })

        expect(connected).toBe(true);

        await serial.sendAndReceiveFromSerial(Command.MEMS_Dataframe7d.command, Command.MEMS_Dataframe7d.responseSize).then((response) => {
            expect(response).toHaveLength(Command.MEMS_Dataframe7d.responseSize);
        })
    });
});

describe('send an action command to serial port', () => {
    it('action response is received from the serial port', async () => {
        let port = '/dev/cu.usbserial-AB0MKMTB';
        let connected = false;

        await serial.connect(port).then((isConnected) => {
            connected = isConnected;
        })

        expect(connected).toBe(true);

        await serial.sendAndReceiveFromSerial(Command.MEMS_STFT_Dec.command, Command.MEMS_STFT_Dec.responseSize).then((response) => {
            expect(response).toHaveLength(Command.MEMS_STFT_Dec.responseSize);
        })
    });
});
