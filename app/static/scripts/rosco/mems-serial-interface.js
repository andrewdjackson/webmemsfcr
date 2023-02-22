const SERIAL_TIMEOUT = 2000;

export class MemsSerialInterface {
    constructor() {
        this._isConnected = false;
        this._port = undefined;
    };

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
                this._read(expectedResponseSize, command),
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
        // abstract function, to be implemented in concrete class
    }

    //
    // open the port for read / write
    //
    async _open() {
        // abstract function, to be implemented in concrete class
    }

    //
    // close the port
    //
    async close() {
        // abstract function, to be implemented in concrete class
    }

    //
    // write the command to the serial port
    //
    async _write(data) {
        // abstract function, to be implemented in concrete class
    }

    //
    // read the bytes from the serial port
    // n specifies the number of bytes to read
    //
    async _read(n, expectedCommand) {
        // abstract function, to be implemented in concrete class
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
}
