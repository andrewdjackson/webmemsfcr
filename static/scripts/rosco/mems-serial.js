export class MemsSerialInterface {
    constructor() {
        this._isConnected = false;
        this._port = undefined;
        this._reader;
        this._writer;
    };

    // The Web Serial API is supported.
    supported() {
        return ("serial" in window.navigator);
    }

    get isConnected() {
        return this._isConnected;
    }

    async Connect() {
        await this._connectToPort()
            .then((port) => {
                this._port = port;
                console.log(`connect: connected to port`);
            })
            .catch((error) => {
                console.error(`connect: error connecting to port ${error}`);
                return error;
            });

        if (this._port !== undefined) {
            await this._open()
                .then((opened) => {
                    console.log(`connect: opened port ${opened}`);
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

    async _connectToPort() {
        return this._getPort()
            .then((port) => {
                return port;
            })
            .catch((error) => {
                return undefined;
            })
    }

    async _getPort() {
        if (this.supported()) {
            return await window.navigator.serial.requestPort();
        }
    }

    async _open() {
        return await this._port.open({baudRate: 9600, bufferSize: 1,})
            .then((opened) => {
                return true;
            }).catch((error) => {
                Promise.reject(error);
            });
    }

    async Disconnect() {
        await this._port.close()
            .then((closed) => {
                console.log(`disconnect: closed port`);
                this._isConnected = false;
            })
            .catch((error) => {
                console.error(`disconnect: error closing port ${error}`);
                Promise.reject(error);
            });

        return this._isConnected;
    }

    async SendAndReceive(command, expectedResponseSize) {
        await this._write(command);
        return await this._read(expectedResponseSize);
    }

    async _write(data) {
        if (this._isConnected) {
            this._initialiseSerialPortWriter();

            const buffer = new ArrayBuffer(1);
            const view = new Uint8Array(buffer);
            view[0] = data;

            return await this._writer.write(view)
                .then((result) => {
                    console.log(`tx: ${this._arrayAsHexString(view)}`);
                })
                .catch((error) => {
                    console.log(`error ${error}`);
                })
                .finally((result) => {
                    this._writer.releaseLock();
                });
        }
    }

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
                            console.log(`reading cancelled`);
                            break;
                        }
                        data[count++] = value[0];

                        //console.log(`rx: ${this._numberAsHexString(value[0])}`);
                    }
                } catch (error) {
                    console.log(`error ${error}`);
                } finally {
                    this._reader.releaseLock();
                    console.log(`rx: ${this._arrayAsHexString(data)}`);
                }
            } else {
                console.log(`no longer readable`);
            }

            return data;
        }
    }

    _initialiseSerialPortReader() {
        if (this._isConnected) {
            this._reader = this._port.readable.getReader();
        }
    }

    _initialiseSerialPortWriter() {
        if (this._isConnected) {
            this._writer = this._port.writable.getWriter();
        }
    }

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
}
