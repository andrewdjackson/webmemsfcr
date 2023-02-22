import * as Command from "./mems-commands.js";
import {MemsSerialInterface} from "./mems-serial-interface.js";

export class MemsBrowserSerialInterface extends MemsSerialInterface {
    constructor() {
        super();

        this._reader;
        this._writer;
    };

    //
    // Check if the browser supports the Web Serial API
    //
    isWebSerialSupported() {
        return ("serial" in window.navigator);
    }

    //
    // connect to the port selected by the user in the browser
    // once connected, open the port for read/write
    //
    async connect() {
        return super.connect();
    }

    //
    // close the port and disconnect from the port
    // returns the status of the connection
    //
    async disconnect() {
        return super.disconnect();
    }

    //
    // send the command bytes to the ecu and wait for the response
    // the command as a byte array and returns the response as a byte array
    //
    async sendAndReceiveFromSerial(command, expectedResponseSize) {
        return super.sendAndReceiveFromSerial(command, expectedResponseSize);
    }

    //
    // get the port selected by the user
    //
    async _connectToPort() {
        return this._getPort()
            .then((port) => {
                return port;
            })
            .catch(() => {
                return undefined;
            })
    }

    //
    // prompts the user to select the port in the browser
    //
    async _getPort() {
        if (this.isWebSerialSupported()) {
            return await window.navigator.serial.requestPort();
        }
    }

    //
    // open the port for read / write
    //
    async _open() {
        return await this._port.open({baudRate: 9600, bufferSize: 1,})
            .then(async () => {
                return true;
            }).catch(() => {
                this._port = undefined;
                return false;
            });
    }

    //
    // close the port
    //
    async close() {
        // cancel any reader locks
        if (this._reader !== undefined) {
            await this._reader.cancel()
                .catch(() => {
                });
            await this._reader.releaseLock();
        }

        // forget the port
        await this._port.forget();
        // close the port
        return await this._port.close();
    }

    //
    // write the command to the serial port
    //
    async _write(data) {
        const buffer = new ArrayBuffer(1);
        const view = new Uint8Array(buffer);
        view[0] = data;

        if (this._port !== undefined) {
            if (await this._port.writable) {
                this._writer = this._port.writable.getWriter();
                return await this._writer.write(view)
                    .then(() => {
                        console.debug(`tx: ${this._arrayAsHexString(view)}`);
                    })
                    .catch((error) => {
                        console.error(`error ${error}`);
                    })
                    .finally(() => {
                        this._writer.releaseLock();
                    });
            }
        }
    }

    //
    // read the bytes from the serial port
    // n specifies the number of bytes to read
    //
    async _read(n, expectedCommand) {
        let rxData = Array(n).fill(0);
        let count = 0;

        if (this._port !== undefined) {
            if (await this._port.readable) {
                this._reader = this._port.readable.getReader();
                try {
                    while (count < n) {
                        const {value, done} = await this._reader.read();
                        if (done) {
                            console.warn(`serial reading cancelled`);
                            break;
                        }
                        if (value) {
                            let chunk = value;

                            // ensure we read all the data if we get multiple bytes
                            for (let i = 0; i < chunk.length; i++) {
                                rxData[count++] = chunk[i];
                            }
                        }
                        if (count === 1 && rxData[0] !== expectedCommand) {
                            console.error(`expecting first byte to match command, discarding byte`);
                            count--;
                        }
                        if (count === 2 && (rxData[0] === Command.MEMS_Dataframe80.command || rxData[0] === Command.MEMS_Dataframe7d.command)) {
                            // read the size of the remaining bytes from the dataframe response
                            let size = rxData[1] + 1;
                            if (size !== n) {
                                console.warn(`expecting ${n} bytes, ecu response contains ${size}`);
                                n = size;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`error ${error}`);
                } finally {
                    this._reader.releaseLock();
                    console.debug(`rx: ${this._arrayAsHexString(rxData)}`);
                }
            } else {
                console.error(`serial not readable`);
            }
        }

        return rxData;
    }
}
