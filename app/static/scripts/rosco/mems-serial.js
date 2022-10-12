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
                this.flush();
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
                    Promise.reject(error);
                });
        }

        return Promise.resolve(this._isConnected);
    }

    //
    // send the command bytes to the ecu and wait for the response
    // the command as a byte array and returns the response as a byte array
    //
    async sendAndReceiveFromSerial(command, expectedResponseSize) {
        if (this._isConnected) {
            await this._write(command);
            return Promise.any([
                this._read(expectedResponseSize),
                new Promise(resolve => setTimeout(resolve, SERIAL_TIMEOUT, 'serial read timeout'))
            ]).then((response) => {
                return response;
            }).catch(((value) => {
                console.info(`promise ${value}`);
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
            .then(() => {
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
        }

        // forget the port
        this._port.forget();
        // close the port
        return await this._port.close();
    }

    async flush() {
        console.info(`flush: flushing read buffer`);

        await Promise.any([
            this._sleep(250),
            this._read(1)
        ]).catch(() => {
            // eat the errors
        }).finally(() => {
            if (this._reader !== undefined) {
                this._reader.cancel().catch(() => {
                });
            }
        })

        console.info(`flush: read buffer flushed`);
    }

    //
    // write the command to the serial port
    //
    async _write(data) {
        this._initialiseSerialPortWriter();

        const buffer = new ArrayBuffer(1);
        const view = new Uint8Array(buffer);
        view[0] = data;

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

    //
    // read the bytes from the serial port
    // n specifies the number of bytes to read
    //
    async _read(n) {
        let data = Array(n).fill(0);
        let count = 0;

        if (this._port !== undefined) {
            if (this._port.readable) {
                this._initialiseSerialPortReader();

                try {
                    while (count < n) {
                        const {value, done} = await this._reader.read();

                        if (done) {
                            console.error(`serial reading cancelled`);
                            break;
                        }
                        data[count++] = value[0];
                    }
                } catch (error) {
                    console.error(`error ${error}`);
                } finally {
                    this._reader.releaseLock();
                    console.debug(`rx: ${this._arrayAsHexString(data)}`);
                }
            } else {
                console.error(`serial not readable`);
            }
        }

        return data;
    }

    //
    // initialise the port reader
    //
    _initialiseSerialPortReader() {
        if (this._isConnected) {
            this._reader = this._port.readable.getReader();
        }
    }

    //
    // initialise the port writer
    //
    _initialiseSerialPortWriter() {
        if (this._isConnected) {
            this._writer = this._port.writable.getWriter();
        }
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

    _numberAsHexString(value) {
        return value.toString(16).padStart(2, '0');
    }

    //
    // asynchronously "sleep" for a period of time
    //
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms, 'sleep timeout'));
    }
}
