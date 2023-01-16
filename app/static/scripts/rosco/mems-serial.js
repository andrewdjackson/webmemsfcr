import * as Command from "./mems-commands.js";

const SERIAL_TIMEOUT = 2000;

export class MemsSerialInterface {
    constructor() {
        this._isConnected = false;
        this._port = undefined;
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
    // check if the serial port is connected
    //
    get isConnected() {
        return this._isConnected;
    }

    //
    // connect to the port selected by the user in the browser
    // once connected, open the port for read/write
    //
    async connect() {
        await this._connectToPort()
            .then((port) => {
                this._port = port;
                console.info(`connect: connected to port`);
            })
            .catch(() => {
                console.error(`connect: error connecting to port`);
                return error;
            });

        if (this._port !== undefined) {
            await this._open()
                .then((opened) => {
                    console.info(`connect: opened port ${opened}`);
                    this._isConnected = opened;
                })
                .catch(() => {
                    console.error(`connect: error opening port`);
                    this._isConnected = false;
                });
        }

        return this._isConnected;
    }

    //
    // close the port and disconnect from the port
    // returns the status of the connection
    //
    async disconnect() {
        if (this._isConnected) {
            await this.close()
                .then(() => {
                    console.log(`disconnect: closed port`);
                    this._isConnected = false;
                })
                .catch((error) => {
                    console.error(`disconnect: error closing port ${error}`);
                    reject();
                });
        }

        return Promise.resolve(this._isConnected);
    }

    //
    // send the command bytes to the ecu and wait for the response
    // the command as a byte array and returns the response as a byte array
    //
    async sendAndReceiveFromSerial(command, expectedResponseSize) {
        if (expectedResponseSize < 1) expectedResponseSize = 1;

        if (this._isConnected) {
            await this._write(command);
            return Promise.any([
                this._read(expectedResponseSize),
                new Promise(resolve => setTimeout(resolve, SERIAL_TIMEOUT, 'serial read timeout'))
            ]).then((response) => {
                return response;
            }).catch(((err) => {
                console.error(`sendAndReceiveFromSerial exception ${err}`);
                reject(err);
            }))
        }

        return [];
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
    async _read(n) {
        let rxData = Array(n).fill(0);
        let count = 0;

        if (this._port !== undefined) {
            if (await this._port.readable) {
                this._reader = this._port.readable.getReader();
                try {
                    while (count < n) {
                        const {value, done} = await this._reader.read();
                        if (done) {
                            console.error(`serial reading cancelled`);
                            break;
                        }
                        if (value) {
                            let chunk = value;

                            // ensure we read all the data if we get multiple bytes
                            for (let i = 0; i < chunk.length; i++) {
                                rxData[count++] = chunk[i];
                            }
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

    //
    // convert bytes into a hex string
    //
    _arrayAsHexString(data) {
        let hex = "";

        data.forEach(value => {
            hex += value.toString(16).padStart(2, '0');
        });

        return hex;
    }

    //
    // asynchronously "sleep" for a period of time
    //
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms, 'sleep timeout'));
    }
}
