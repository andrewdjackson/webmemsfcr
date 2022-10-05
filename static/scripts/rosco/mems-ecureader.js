import * as Command from "./mems-commands.js";

const MAX_ECU_SERIAL_RW_INTERVAL = 250;
const STANDARD_DATAFRAME_REQUEST_INTERVAL = 200;

export class ECUResponse {
    constructor(command, response) {
        this.command = command;
        this.response = response;
    }
};

export class ECUReader {
    constructor(responseEventQueue) {
        // state
        this._isConnected = false;
        this._paused = false;
        this._isDataframeRequestLoopRunning = false;
        this._sentCount = 0;

        // queues
        this._responseEventQueue = responseEventQueue;
        this._commandQueue = [];
        this._dataframeCommands = [Command.MEMS_Dataframe80, Command.MEMS_Dataframe7d];

        // request a new dataframe at regular intervals
        this._dataframeRequestInterval = STANDARD_DATAFRAME_REQUEST_INTERVAL;
        this._dataframeRequestTimer;

        // this is the fastest rate at which the ECU can respond to a dataframe request
        this._commandQueueInterval = MAX_ECU_SERIAL_RW_INTERVAL;
        this._commandQueueTimer;
    };

    //
    // base function
    // starts the listener for sending commands
    // from the command queue
    // todo: should be inherited by subclass with specific hardware implementation (e.g open serial port and initialise)
    //
    async connect() {
        this._isConnected = true;
        this._startSendingCommandEvents();
    }

    //
    // base function
    // on disconnect, stop sending dataframe requests
    // wait for the queue to finish sending
    // todo: should be inherited by subclass with specific hardware implementation (e.g. close serial port)
    //
    async disconnect() {
        this._stopSendingDataframeRequestEvents();
        this._clearQueue();

        // wait for response if already in progress
        await this._sleep(MAX_ECU_SERIAL_RW_INTERVAL);

        await this._waitForQueueToFinish()
            .then(() => {
                this._isConnected = false;
            })
            .catch(() => {
                this._clearQueue();
            })
            .finally(() => {
                this._stopSendingCommandEvents();
            });
    }

    get isConnected() {
        return this._isConnected;
    }

    setDataframeCommands(commands) {
        this._dataframeCommands = commands;
    }

    //
    // start sending dataframe commands and sending commands from the command queue
    //
    startDataframeLoop() {
        if (!this._isDataframeRequestLoopRunning) {
            this._startSendingDataframeRequestEvents();
            this._isDataframeRequestLoopRunning = true;
        }
    }

    _startSendingDataframeRequestEvents() {
        this._dataframeRequestTimer = setInterval(this._queueDataframeCommand.bind(this), this._dataframeRequestInterval);
        console.info(`started dataframe request loop (interval ${this._dataframeRequestInterval}ms)`);
    }

    _startSendingCommandEvents() {
        this._commandQueueTimer = setInterval(this._sendNextCommandFromQueue.bind(this), this._commandQueueInterval);
        console.info(`started command queue loop (interval ${this._commandQueueInterval}ms)`);
    }

    //
    // stop sending dataframe commands and sending commands from the command queue
    //
    stopDataframeLoop() {
        if (this._isDataframeRequestLoopRunning) {
            this._stopSendingDataframeRequestEvents();
            this._isDataframeRequestLoopRunning = false;
        }
    }

    _stopSendingDataframeRequestEvents() { clearInterval(this._dataframeRequestTimer); }
    _stopSendingCommandEvents() { clearInterval(this._commandQueueTimer); }

    //
    // send the next command in the queue
    //
    _sendNextCommandFromQueue() {
        if (this._commandQueue.length > 0) {
            // get command from the head of the queue and set the message id
            let ecuCommand = this._commandQueue.shift();

            console.debug(`${Date.now().toString()} : send next command ${JSON.stringify(ecuCommand)} from the queue`);

            // send the command and publish the response
            this._sendAndReceive(ecuCommand);
        }
    }

    //
    // send the command to the ecu and wait for the response
    // this function calls sendToECU which will be overridden in the subclass
    // the response is published on the event queue
    //
    async _sendAndReceive(ecuCommand) {
        // send the command
        await this.sendToECU(ecuCommand)
            .then((response) => {
                // increment send count
                this._sentCount++;

                // validate the response matches the command sent
                let ecuResponse = new ECUResponse(ecuCommand, response);

                if (ecuCommand.command === ecuResponse.response[0]) {
                    // publish the received data
                    this._responseEventQueue.publish(ecuCommand.topic, ecuResponse);
                    return ecuResponse;
                } else {
                    return Promise.reject(ecuResponse);
                }
            })
            .catch(() => {
                return Promise.reject();
            });
    }

    _queueDataframeCommand() {
        if (!this.isPaused) {
            // queue a request for the dataframes
            this._dataframeCommands.forEach(ecuCommand => {
                console.log(`queuing dataframe request ${JSON.stringify(ecuCommand)}`);
                this.addCommandToSendQueue(ecuCommand);
            });
        } else {
            console.log(`queuing heartbeat`)
            // queue a heartbeat command
            this.addCommandToSendQueue(Command.MEMS_Heartbeat);
        }
    }

    _clearQueue() {
        this._commandQueue = [];
    }

    async _waitForQueueToFinish() {
        let queueLength = this._commandQueue.length;

        console.debug(`waiting for command queue (${queueLength})`);
        await this._sleep(queueLength * this._commandQueueInterval);

        if (this._commandQueue.length === 0) {
            console.debug(`command queue drained`);
            return Promise.resolve(true);
        } else {
            console.error(`command queue (${this._commandQueue.length}) failed to drain`);
            return Promise.reject(false);
        }
    }

    //
    // add a command to the queue for sending to the ECU
    // returns true / false if the command was successfully added to the queue
    //
    addCommandToSendQueue(ecuCommand, top) {
        ecuCommand.id = this.getMessageId();
        console.log(`queuing command ${JSON.stringify(ecuCommand)}`);

        let currentSize = this._commandQueue.length;
        let newLength = currentSize;

        if (top === true) {
            newLength = this._commandQueue.unshift(ecuCommand);
        } else {
            newLength = this._commandQueue.push(ecuCommand);
        }


        return newLength > currentSize;
    }

    //
    // abstract class for testing: TODO override function in subclass
    // send the command to the ECU and wait for the response
    //
    async sendToECU(ecuCommand) {
        console.log(`sent command (${this.sent}) ${ecuCommand.command}`);

        // generate a response
        let response = Array(ecuCommand.responseSize).fill(0);
        response[0] = ecuCommand.command;

        console.log(`received response ${response}`);
        return Promise.resolve(response);
    }

    //
    /// whenever a message is successfully sent and received, increment the counter
    //
    get sent() {
        return this._sentCount;
    }

    //
    // every message has a unique id which is the timestamp of the message creation time
    //
    getMessageId() {
        return Date.now();
    }

    //
    // pause requesting dataframes from the ecu
    // heatbeats are sent whilst the loop is paused
    //
    get isPaused() {
        return this._paused;
    }

    set paused(pause) {
        this._paused = pause;

        if (this._paused) {
            // clear the queue if when pausing the dataframe loop
            // this ensures the pause happens immediately
            this._clearQueue();
        }
    };

    //
    // gets / sets the rate at which the dataframe requests are generated
    // this should be the same or higher than the rate commands are send and received from the ecu
    //
    getDataframeInterval() {
        return this._dataframeRequestInterval;
    }

    setDataframeInterval(interval) {
        if (interval < MAX_ECU_SERIAL_RW_INTERVAL) {
            console.error(`dataframe request interval of ${this._dataframeRequestInterval}ms cannot be faster than ${MAX_ECU_SERIAL_RW_INTERVAL}ms`)
        } else {
            this._dataframeRequestInterval = interval;
            console.info(`dataframe request interval set to ${this._dataframeRequestInterval}ms`);

            // restart the dataframe loop with the new interval
            if (this._isDataframeRequestLoopRunning) {
                this.stopDataframeLoop();
                this.startDataframeLoop();
            }
        }
    }

    //
    // asynchronously "sleep" for a period of time
    //
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}