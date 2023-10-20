import {describe, expect, beforeEach, it} from "@jest/globals";
import fetchMock from "jest-fetch-mock";

import * as Command from "./mems-ecu2j-commands.js";
import {EventTopic} from "./mems-queue.js";

beforeEach(() => {
    window.ecuVersion = "2J";
});

describe('MEMS2J UDS Commands', () => {
    it('should create a valid UDS command with no data', () => {
        let command = new Command.UDSRequest(0, EventTopic.Initialisation, [0x10, 0xA0], [], 1);
        expect(command.length).toBe(2);
        expect(command.serviceId).toBe(0x10);
        expect(command.subFunction).toBe(0xA0);
        expect(command.data).toEqual([]);
        expect(command.checksum).toBe(0xB2);
        expect(command.command).toEqual([0x02, 0x10, 0xA0, 0xB2]);
    })

    it('should create a valid UDS command with data', () => {
        let command = new Command.UDSRequest(0, EventTopic.Initialisation, [0x31, 0xCB], [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],1);
        expect(command.length).toBe(17);
        expect(command.serviceId).toBe(0x31);
        expect(command.subFunction).toBe(0xCB);
        expect(command.data).toEqual([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        expect(command.checksum).toBe(0x0d);
        expect(command.command).toEqual([0x11, 0x31, 0xCB, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0D]);
    })
})

