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
            .catch((error) => {
                console.error(`connect: error connecting to port ${error}`);
                return error;
            });

        if (this._port !== undefined) {
            await this._open()
                .then((opened) => {
                    console.info(`connect: opened port ${opened}`);
                    this._isConnected = opened;
                })
                .catch((error) => {
                    this._isConnected = false;
                   console.error(`connect: error opening port ${error}`);
                   Promise.reject(error);
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
            await this._port.close()
                .then((closed) => {
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
        await this._write(command);
        return Promise.any([
            this._read(expectedResponseSize),
            new Promise(resolve => setTimeout(resolve, 1000, 'timeout'))
        ]).then((response) => {
            return response;
        }).catch(((value) => {
            console.info(`promise ${value}`);
        }))
        //return await this._read(expectedResponseSize);
    }

    //
    // get the port selected by the user
    //
    async _connectToPort() {
        return this._getPort()
            .then((port) => {
                return port;
            })
            .catch((error) => {
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
            .then((opened) => {
                return true;
            }).catch((error) => {
                Promise.reject(error);
            });
    }

    //
    // write the command to the serial port
    //
    async _write(data) {
        if (this._isConnected) {
            this._initialiseSerialPortWriter();

            const buffer = new ArrayBuffer(1);
            const view = new Uint8Array(buffer);
            view[0] = data;

            return await this._writer.write(view)
                .then((result) => {
                    console.debug(`tx: ${this._arrayAsHexString(view)}`);
                })
                .catch((error) => {
                    console.error(`error ${error}`);
                })
                .finally((result) => {
                    this._writer.releaseLock();
                });
        }
    }

    //
    // read the bytes from the serial port
    // n specifies the number of bytes to read
    //
    async _read(n) {
        if (this._isConnected) {
            let data = Array(n).fill(0);
            let count = 0;

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
                console.error(`serial no longer readable`);
            }

            return data;
        }
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
        return new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
    }
}
