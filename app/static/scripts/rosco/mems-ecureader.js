import * as Command from "./mems-1x/mems-commands.js";
import {ECUCommand} from "./mems-1x/mems-commands.js";

// rate at which commands will be sent to the ECU
// MEMS 1.6 dataframe request / response takes 150ms
const MAX_ECU_SERIAL_RW_INTERVAL = 250;
// rate at which dataframes will be requested, since we request 0x80 and 0x7D at the same time
// this must be a minimum of double the serial rw rate
const STANDARD_DATAFRAME_REQUEST_INTERVAL = MAX_ECU_SERIAL_RW_INTERVAL * 2;
// rate at which connection keep-alive heartbeats will be requested
const STANDARD_HEARTBEAT_REQUEST_INTERVAL = 5000;
// maximum commands in the queue
const MAX_QUEUE_LENGTH = 4;

export class ECUResponse {
    constructor(command, response) {
        this.command = command;
        this.response = response;
    }
}

export class ECUReader {
    constructor(responseEventQueue) {
        // state
        this._isConnected = false;
        this._paused = false;
        this._isDataframeRequestLoopRunning = false;
        this._waitingForResponse = false;
        this._sentCount = 0;
        this._messageId = 0;
        this._ecuId = "";

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

        this._engineRunning = false;
    };

    get isConnected() {
        return this._isConnected;
    }

    get isEngineRunning() {
        return this._engineRunning;
    }

    get ecuId() {
        return this._ecuId;
    }

    //
    // base function
    // todo: must be OVERRIDDEN by subclass with specific hardware implementation (e.g open serial port and initialise)
    //
    async connect() {
        this._isConnected = false;
        this._paused = false;
        return await this.connected();
    }

    //
    // todo: should be INHERITED by subclass once physical connection has completed successfully
    // starts the listener for sending commands from the command queue
    //
    async connected() {
        this._isConnected = true;
        this._paused = false;
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
            if (this._waitingForResponse) {
                console.info(`waiting for serial response, adding command to the queue (${this._commandQueue.length} waiting)`);

                // on machines with slower processors the queue can grow faster than
                // it can process the serial communications. reduce the queue to include unique commands only
                if (this._commandQueue.length > MAX_QUEUE_LENGTH) {
                    console.warn(`queue too long (${this._commandQueue.length}), clearing duplicates`);
                    this._commandQueue = this._clearBacklog();
                }
            } else {
                // get command from the head of the queue and set the message id
                let ecuCommand = this._commandQueue.shift();

                console.debug(`${Date.now().toString()} : send next command ${JSON.stringify(ecuCommand)} from the queue (${this._commandQueue.length})`);

                // send the command and publish the response
                this._sendAndReceive(ecuCommand)
                    .then(() => {
                    })
                    .catch((error) => {
                        console.error(`${error}`)
                    })
            }
        }
    }

    //
    // removes duplicate commands from the queue
    //
    _clearBacklog() {
        // remove any duplicate requests
        return this._dedupArrayByProperty(this._commandQueue, "command");
    }

    _dedupArrayByProperty(arr, prop) {
        let dedupedArray = Array.from(
            arr
                .reduce(
                    (acc, item) => (
                        item && item[prop] && acc.set(item[prop], item), acc
                    ), // using map (preserves ordering)
                    new Map()
                )
                .values()
        )

        dedupedArray.sort(this._sortByMessageId);
        return dedupedArray;
    }

    _sortByMessageId(a, b) {
        return a.id - b.id;
    }

    //
    // send the command to the ecu and wait for the response
    // this function calls sendToECU which will be overridden in the subclass
    // the response is published on the event queue
    //
    async _sendAndReceive(ecuCommand) {
        // prevent another request whilst waiting for a response
        this._lockSendRecieve();

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
                    return new Error(`_sendAndReceive command response do not match ${JSON.stringify(ecuResponse)}`);
                }
            })
            .catch((err) => {
                console.warn(`_sendAndReceive exception (${err})`);
            })
            .finally(() => {
                this._unlockSendRecieve();
            });
    }

    _lockSendRecieve() {
        this._waitingForResponse = true;
    }

    _unlockSendRecieve() {
        this._waitingForResponse = false;
    }

    _queueDataframeCommand() {
        if (!this.isPaused) {
            console.debug(`queuing dataframe commands`);
            if (this._hasQueueSpace(this._dataframeCommands.length)) {
                // queue a request for the dataframes
                this._dataframeCommands.forEach(async ecuCommand => {
                    let cmd = new ECUCommand(0, ecuCommand.topic, ecuCommand.command, ecuCommand.responseSize);
                    console.debug(`queuing dataframe request ${JSON.stringify(cmd)}`);
                    this.addCommandToSendQueue(cmd);
                });
            }
        } else {
            console.debug(`queuing heartbeat`);
            if (this._hasQueueSpace(1)) {
                // queue a heartbeat command
                this.addCommandToSendQueue(Command.MEMS_Heartbeat);
            }
        }
    }

    _clearQueue() {
        this._commandQueue = [];
    }

    _hasQueueSpace(spaces) {
        const queueLength = this._commandQueue.length;
        const targetQueueLength = MAX_QUEUE_LENGTH - spaces;

        const hasSpace = (queueLength < targetQueueLength);

        if (!hasSpace) {
            console.debug(`command queue is ${queueLength} and need ${spaces} spaces, ignoring command`);
        }

        return hasSpace;
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
        console.debug(`queuing command ${JSON.stringify(ecuCommand)}`);

        let currentSize = this._commandQueue.length;
        let newLength;

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
        console.info(`sent command (${this.sent}) ${ecuCommand.command}`);

        // generate a response
        let response = Array(ecuCommand.responseSize).fill(0);
        response[0] = ecuCommand.command;

        console.info(`received response ${response}`);
        return response;
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
        this._messageId++;
        console.debug(`generating request id ${this._messageId}`);
        return this._messageId;
    }

    //
    // pause requesting dataframes from the ecu
    // heatbeats are sent whilst the loop is paused
    //
    get isPaused() {
        return this._paused;
    }

    set paused(pause) {
        let interval = STANDARD_DATAFRAME_REQUEST_INTERVAL;
        let dataframeRequest;
        this._paused = pause;

        if (this._paused) {
            if (this._isNextCommand7dDataframeRequest()) {
                // need to process this request to complete the dataframe pair before pausing
                dataframeRequest = this._commandQueue.at(0);
            }
            // clear the queue if when pausing the dataframe loop
            // this ensures the pause happens immediately
            this._clearQueue();

            // add the dataframe pair request to be processed first
            if (dataframeRequest !== undefined) {
                this.addCommandToSendQueue(dataframeRequest, true);
            }

            // increase the interval time, so heartbeats are sent at 1s intervals
            interval = STANDARD_HEARTBEAT_REQUEST_INTERVAL;
        }

        // stop and start the dataframe interval timer for new timing to take effect
        this._dataframeRequestInterval = interval;
        this.stopDataframeLoop();
        this.startDataframeLoop();
    };

    _isNextCommand7dDataframeRequest() {
        if (this._commandQueue.length > 0) {
            const command = this._commandQueue.at(0);
            return (command.command === Command.MEMS_Dataframe7d.command);
        }

        return false;
    }
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
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
