import {MemsEcu16} from "./mems-ecu16";
import * as Command from "./mems-ecu2j-commands.js";
import {EventTopic} from "./mems-queue.js";

export class MemsEcu2J extends MemsEcu16 {
    constructor(responseEventQueue, serialInterface) {
        console.info("setting ECU to MEMS 2J");
        super(responseEventQueue, serialInterface);
    }

    //
    // Mems 2J Initialisation
    // All commands start with a length byte and have a checksum byte appended [length, command, checksum]
    // https://en.wikipedia.org/wiki/Unified_Diagnostic_Services
    //
    //  1. Wakeup ECU with 5 baud KLine sequence
    //  2. Response 0x00 (byproduct of the wakeup sequence)
    //  3. Send 2J initialisation sequence: 0x81, 0x13, 0xF7, 0x81, 0x0C (exact byte sequence)
    //  4. Diagnostics Session Control: 0x10, 0xA0
    //  5. Diagnostics Session Control Response: 0x50
    //  6. Security Access Request Seed: 0x27, 0x01
    //  7. Security Access Seed Response 0x67, 0x01, 0xXX, 0xXX
    //  8. Security AccessSend Key: 0x27, 0x02, 0xXX, 0xXX
    //  9. Security Access Key Response 0x67, 0x02, 0x00, 0x00
    // 10. Send Heartbeat 0x3E 0x01
    // 11. Heartbeat Response 0x7E
    // 12. Initialisation Complete Response 0x03, 0xC1, 0xD5, 0x8F, 0x28?
    // 13. Wait 100ms
    // 14. Enter Diagnostics Session Control 0x10, 0xA0?
    //

    async _initialise() {
        let ecuAwake = false;

        console.debug("performing MEMS 1.9 k-line initialisation");

        ecuAwake = await this._klineWakeup();

        // override standard initialisation sequence with 2J sequence
        if (ecuAwake) {
            return await this._initialise();
        }

        console.warn("ecu wakeup and initialisation failed");
        return false;
    }

    // Security algorithm
    // First, the client requests for a seed to unlock a specific security level (identified by a number).
    // This seed is usually a random value that the client must use in order to compute the key.
    // It is meant to prevent someone from recording the CAN bus message exchange and then gaining privileges by blindly sending what was recorded.
    // In cryptography terms, the seed is a nonce used to avoid replay attacks.
    //
    // Once the client gets the seed, it must compute a key using an algorithm that is defined by the ECU manufacturer and known by the server.
    //
    // The client then sends the key to the server, the server verifies it and, if it matches the server’s value,
    // the security level is unlocked and a positive message is responded to the client.
    //
    // The security algorithm can be any algorithm. The lack of algorithm definition in the UDS standard leaves some room for good security design,
    // but also for poor design - it’s up to the manufacturer.
    // Yes, some manufacturers implement security through obscurity while some others will go for a more robust pre-shared key scheme.
    //
    //  6. Request Seed: 0x27, 0x01
    //  7. Seed Response 0x67, 0x01, 0xXX, 0xXX
    //  8. Send Key: 0x27, 0x02, 0xXX, 0xXX
    //  9. Key Response 0x67, 0x02, 0x00, 0x00
    async _authenticateECU() {
        let request = Command.UDSRequest(0, EventTopic.Initialisation, Command.MEMS2J_Authentication.AUTHENTICATE, 3);
        let response = await this._serial.sendAndReceiveFromSerial(request.command, request.responseSize);
        response = new Command.UDSResponse(EventTopic.Initialisation, response);

        const key = this._computeKey(authResponse);
        request = Command.UDSRequest(0, EventTopic.Initialisation, Command.MEMS2J_Authentication.SEND_KEY, 5, key);
        response = await this._serial.sendAndReceiveFromSerial(request.command, request.responseSize);


    }

    _computeKey(udsResponse) {
        let seed = udsResponse.data[0] << 8;
        seed += udsResponse.data[1];

        return this._get_key_from_seed(seed);
    }

    _get_key_from_seed(seed) {
        let key;
        let loops = 1;

        if (this._get_bit(15,seed)) { loops += 8; }
        if (this._get_bit(7,seed)) { loops += 4; }
        if (this._get_bit(4,seed)) { loops += 2; }
        if (this._get_bit(0,seed)) { loops += 1; }

        while (loops > 0) {
            key = seed >> 1; // take the seed shifted right by 1 (each loop changes seed)

            if (this._get_bit(13,seed) && this._get_bit(3,seed)) {
                key &= 0b11111111111111110; // unset LSB
            } else {
                key |= 0b0000000000000001; // set LSB
            }

            const xors = this._get_bit(9,seed) ^ this._get_bit(8,seed) ^ this._get_bit(2,seed) ^ this._get_bit(1,seed);
            if (xors) {
                key |= 0b1000000000000000; // set msb
            }

            seed = key;
            loops--;
        }

        return key;
    }

    _get_bit(bit_num, byte) {
        // returns the requested bit, counting from 0-7, 0-15 for doubles
        return (byte >> bit_num) & 1;
    }

    async _klineWakeup() {
        // send wake up signal
        await this._port.setSignals({brk: false, break: false});
        await this._sleep(2000);
        await this._port.setSignals({brk: true, break: true});
        await this._sleep(25);
        await this._port.setSignals({brk: false, break: false});
        await this._sleep(25);
    }

    async  _initialise() {
        let initialised = false;

        if (this._serial.isConnected) {
            let response;

            // initialisation sequence
            response = await this._serial.sendAndReceiveFromSerial(Command.MEMS_InitA.command, Command.MEMS_InitA.responseSize);

            // when the line is initialised for the first time, a x00 byte can be returned
            // read again until we receive the expected response
            if (response[0] !== Command.MEMS_InitA.command) {
                console.warn(`unexpected response from ecu`);
            } else {
                // response successful
                initialised = true;
            }

            // continue if first part of initialisation is successful
            if (initialised) {
                await this._serial.sendAndReceiveFromSerial(Command.MEMS_InitB.command, Command.MEMS_InitB.responseSize);
                await this._serial.sendAndReceiveFromSerial(Command.MEMS_Heartbeat.command, Command.MEMS_Heartbeat.responseSize);

                await this._getECUId();
                this.startDataframeLoop();
            }
        }

        if (!initialised) {
            console.error(`initialisation of the ecu failed`);
            await this._serial.close();
        }

        return initialised;
    }

    async _initEcu2J() {
        console.info("Attempting ECU connection (2J)...");
        let dataBuffer = [];

        // send wake up signal
        await this._port.setSignals({brk: false, break: false});
        await this._sleep(2000);
        await this._port.setSignals({brk: true, break: true});
        await this._sleep(25);
        await this._port.setSignals({brk: false, break: false});
        await this._sleep(25);

        // read off our zero
        await this._readOnce();
        await sendToKLineEcuRaw([0x81, 0x13, 0xF7, 0x81, 0x0C]);
        await parseDataBuffer2J();
    }

    async _readOnce() {
        try {
            const { value, done } = await this._reader.read();
            if (!value) {
                debug("readOnce - no data/cancelled");
                return false;
            }
            // console.log(value);

            var added = 0;

            for (var i=0; i<value.length; i++) {
                if (!doingSlowInit19 && !gotKLineEcho) {
                    // this should be our echo or something has gone wrong
                    if (value[i] == lastKLineByte) {
                        // debug("Got our kline echo");
                        gotKLineEcho = true;
                        continue; // need to continue, cases here where it gets the echo and reply immediately together
                    }
                }

                // (k-line ecus) - actually got some data back here, not just our own echos
                dataBuffer.push(value[i]);
                if (debugDataEnabledElement.checked) {
                    console.log("< "+value[i]);
                }
                added++;
            }

            if (dataBuffer.length < added) {
                debug("Not all bytes got added somehow??");
            }

            // might end up with nothing after throwing k-line echo away?
            if (dataBuffer.length == 0) {
                return true;
            }
        } catch (e) {
            debug("readOnce caught: "+e);
            console.log("readOnce caught: "+e);
        }
        return true;
    }

    async  _sleep(ms) {
        if (ms > 10) {
            var timeoutSleep = ms - 10;
            ms = 10;
            await new Promise(resolve => setTimeout(resolve, timeoutSleep));
        }
        _busySleepMsPerformance(ms);
    }

    _busySleepMs(ms) {
        var start = new Date().getTime();
        var stop = start + ms;
        while (new Date().getTime() < stop) {
            // lol
        }
    }

    _busySleepMsPerformance(ms) {
        var start = performance.now();
        var stop = start + ms;
        while (performance.now() < stop) {
            // lol
        }
    }

    _xor_all_bytes(bytes) {
        let current = 0
        for (let i=0; i<bytes.length; i++) {
            current = current ^ bytes[i];
        }
        return current;
    }

    _checksum_all_bytes(bytes) {
        let sum_checksum = 0;
        for (let i=0; i<bytes.length-1; i++) {
            sum_checksum += bytes[i];
        }
        return sum_checksum & 0xFF;
    }


}
