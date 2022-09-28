import {EventTopic} from "./mems-queue.js";

export class ECUCommand {
    constructor(id, topic, command, responseSize) {
        this.id = id;
        this.topic = topic;
        this.command = command;
        this.responseSize = responseSize;
    }
};

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
        this._isStarted = false;
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
    }

    async Disconnect() {
        this._isConnected = false;
    }

    get isConnected() {
        return this._isConnected;
    }

    get isStarted() {
        return this._isStarted;
    }

    //
    // start sending dataframe commands and sending commands from the command queue
    //

    Start() {
        if (!this.isStarted) {
            this._startSendingDataframeRequestEvents();
            this._startSendingCommandEvents();

            this._isStarted = true;
        }
    }

    _startSendingDataframeRequestEvents() { this._dataframeRequestTimer = setInterval(this._queueDataframeCommand.bind(this), this._refreshInterval); }
    _startSendingCommandEvents() { this._commandQueueTimer = setInterval(this._sendNextCommandFromQueue.bind(this), this._refreshInterval); }

    //
    // stop sending dataframe commands and sending commands from the command queue
    //

    Stop() {
        if (this.isStarted) {
            this._stopSendingDataframeRequestEvents();
            this._stopSendingCommandEvents();

            this._isStarted = false;
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
        } else {
            console.debug(`${Date.now().toString()} : empty command queue, nothing to send`);
        }
    }

    _queueDataframeCommand() {
        let ecuCommand;

        if (!this.isPaused) {
            console.log(`queuing dataframe request`)
            // queue a request for the dataframes
            ecuCommand = new ECUCommand(0, EventTopic.Dataframe, 0x80, 29);
            this._addCommandToQueue(ecuCommand);

            ecuCommand = new ECUCommand(0, EventTopic.Dataframe, 0x7d, 33);
        } else {
            console.log(`queuing heartbeat`)
            // queue a heartbeat command
            ecuCommand = new ECUCommand(0, EventTopic.Heartbeat, 0xf4, 1 );
        }

        // add command to the queue
        this._addCommandToQueue(ecuCommand);
    }

    //
    // add a command to the queue for sending to the ECU
    // returns true / false if the command was successfully added to the queue
    //

    _addCommandToQueue(ecuCommand) {
        ecuCommand.id = this.getMessageId();
        console.log(`queuing command ${JSON.stringify(ecuCommand)}`);

        let currentSize = this._commandQueue.length;
        let newLength = this._commandQueue.push(ecuCommand);

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





/*
    //
    // executes the ecu command, rate if send is controlled here by waiting for
    // the timer to complete and the response from the ecu
    //

    async _old_sendToECU() {
        // get command from the head of the queue
        let ecuCommand = this._commandQueue.shift();
        console.info(`${Date.now().toString()} : sendToECU Executing ${ecuCommand.id}.${ecuCommand.topic}`);

        return Promise.allSettled([
            // execute the command and send the response to the receiver function
            ecuCommand.command
                .then(response => {
                    console.debug(`${Date.now().toString()} : sendToECU Response ${ecuCommand.id}.${ecuCommand.topic}`);
                    this._receivedFromECU(ecuCommand.topic, response);
                })
                .catch(err => {
                    console.error(`${Date.now().toString()} : sendToECU Response ${ecuCommand.id}.${ecuCommand.topic} -> ${err}`);
                }),

            // wait for timer to expire, this essentially controls the
            // rate at which the commands are sent to the ecu
            this._sleep(this._refreshInterval).then(result => {
                console.debug(`${Date.now().toString()} : sendToECU Timer expired ${ecuCommand.id}.${ecuCommand.topic}`);
            }),
        ]).then(response => {
            console.debug(`${Date.now().toString()} : sendToECU Completed ${ecuCommand.id}.${ecuCommand.topic}`);
        });
    }

    //
    // publish the response received from the ecu on the event queue
    //

    _receivedFromECU(topic, response) {
        this._responseEventQueue.publish(topic, response);
    }
*/

}
