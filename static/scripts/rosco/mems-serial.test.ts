// @vitest-environment jsdom

import { describe, it, expect } from 'vitest'
import {MemsSerialInterface, MemsSerialError} from "./mems-serial.js";

class NavigatorSerialMock {
    async requestPort() {
        console.log(`mock: requestPort()`);
        return ["/usb"];
    }
}

window.navigator.serial = new NavigatorSerialMock();
var memsSerialInterface = new MemsSerialInterface();

describe('connect', () => {
    it('Should support the Web Serial API', () => {
        expect(memsSerialInterface.supported()).toBe(true);
    })

    it('Should connect the serial port', () => {
        memsSerialInterface.Connect()
            .then((connected) => {
                expect(connected).toBe(true);
            });
    })
})
