import {MEMS_Dataframe7d, MEMS_Dataframe80, MEMS_Heartbeat} from "./mems-commands.js";

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

        // interval timers
        this._refreshInterval = 1000;
        this._commandQueueTimer;
        this._dataframeRequestTimer;
    };

    //
    // connection abstract functions
    //

    async Connect() {
        this._isConnected = true;
        this._startSendingCommandEvents();
    }

    async Disconnect() {
        this._stopSendingCommandEvents();
        this._clearQueue();
        this._isConnected = false;
    }

    get isConnected() {
        return this._isConnected;
    }

    //
    // start sending dataframe commands and sending commands from the command queue
    //

    StartDataframeLoop() {
        if (!this._isDataframeRequestLoopRunning) {
            this._startSendingDataframeRequestEvents();
            this._isDataframeRequestLoopRunning = true;
        }
    }

    _startSendingDataframeRequestEvents() {
        this._dataframeRequestTimer = setInterval(this._queueDataframeCommand.bind(this), this._refreshInterval);
        console.log(`started dataframe request queue loop`);
    }

    _startSendingCommandEvents() {
        this._commandQueueTimer = setInterval(this._sendNextCommandFromQueue.bind(this), this._refreshInterval);
        console.log(`started command queue loop`);
    }

    //
    // stop sending dataframe commands and sending commands from the command queue
    //

    StopDataframeLoop() {
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

    _queueDataframeCommand() {
        let ecuCommand;

        if (!this.isPaused) {
            console.log(`queuing dataframe request`);
            // queue a request for the dataframes
            this.AddCommandToSendQueue(MEMS_Dataframe7d);
            // queue the second request
            ecuCommand = MEMS_Dataframe80;
        } else {
            console.log(`queuing heartbeat`)
            // queue a heartbeat command
            ecuCommand = MEMS_Heartbeat;
        }

        // add command to the queue
        this.AddCommandToSendQueue(ecuCommand);
    }

    _clearQueue() {
        this._commandQueue = [];
    }
    //
    // add a command to the queue for sending to the ECU
    // returns true / false if the command was successfully added to the queue
    //

    AddCommandToSendQueue(ecuCommand, top) {
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

    async _sendAndReceive(ecuCommand) {
        // send the command
        let response = await this.SendToECU(ecuCommand);

        // increment send count
        this._sentCount++;

        // publish the received data
        let ecuResponse = new ECUResponse(ecuCommand, response);
        this._responseEventQueue.publish(ecuCommand.topic, ecuResponse);
    }

    //
    // send the command to the ECU and wait for the response
    // function to be overridden
    //

    async SendToECU(ecuCommand) {
        console.log(`sent command (${this.sent}) ${ecuCommand.command}`);

        // generate a response
        let response = Array(ecuCommand.responseSize).fill(0);
        response[0] = ecuCommand.command;

        console.log(`received response ${response}`);
        return response;
    }

    get sent() {
        return this._sentCount;
    }

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
    };

    //
    // gets / sets the rate at which commands can be sent to the ecu
    //

    get interval() {
        return this._refreshInterval;
    }

    set interval(interval) {
        this._refreshInterval = interval;
    }

    //
    // asynchronously "sleep" for a period of time
    //

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
