import {MemsAPIError} from "./mems-server.js";
import {EventTopic} from "./mems-queue.js";

export class ECUCommand {
    constructor(id, topic, command) {
        this.id = id;
        this.topic = topic;
        this.command = command;
        this.responseSize = 2;
    }
};

export const ECUCommandType = {
    Dataframe:   "dataframe",
    Heartbeat:  "heartbeat",
    Adjustment: "adjustment",
    Actuator: "actuator",
    Reset: "reset",
    IAC: "iac",
};

export class ECUReader {
    constructor(responseEventQueue) {
        this._isConnected = false;
        this._paused = false;
        this._messageId = 0;
        this._responseEventQueue = responseEventQueue;
        this._commandQueue = [];
        this._refreshInterval = 1000;
    };

    // abstract functions
    Connect() {
        this._isConnected = true;
    }

    Disconnect() {
        this._isConnected = false;
    }

    // send ECUCommand and return the ECUResponse
    async SendAndReceive(ecuCommand) {
        ecuCommand.id = this.messageId;
        console.log(`queuing command ${ecuCommand}`);

        // add command to the queue
        this._addCommandToQueue(ecuCommand);
    }

    get messageId() {
        return this._messageId++;
    }

    //
    // request dataframes at the specified rate
    //

    async GetDataframes() {
        while (this.isConnected) {
            this._queueDataframeCommand();

            // wait before sending another request
            return await this._sleep(this._refreshInterval);
        }
    }

    _queueDataframeCommand() {
        let ecuCommand;
        let id = this._messageId++;

        if (!this.isPaused) {
            console.log(`queuing dataframe request`)
            // queue a request for the dataframes
            ecuCommand = new ECUCommand(id, EventTopic.Dataframe, ECUCommandType.Dataframe );
        } else {
            console.log(`queuing heartbeat`)
            // queue a heartbeat command
            ecuCommand = new ECUCommand(id, EventTopic.Heartbeat, ECUCommandType.Heartbeat );
        }

        // add command to the queue
        this._addCommandToQueue(ecuCommand);

        // service the queue
        // await this._sendToECU();
    }

    get isConnected() {
        return this._isConnected;
    }

    //
    // pause getting dataframes from the ecu
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
    // add a command to the queue for sending to the ECU
    // returns true / false if the command was successfully added to the queue
    //

    _addCommandToQueue(ecuCommand) {
        let currentSize = this._commandQueue.length;
        let newLength = this._commandQueue.push(ecuCommand);

        return newLength > currentSize;
    }

    //
    // executes the ecu command, rate if send is controlled here by waiting for
    // the timer to complete and the response from the ecu
    //

    async _sendToECU() {
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

    //
    // asynchronously "sleep" for a period of time
    //

    _sleep(ms) {
        console.debug(`${Date.now().toString()} : sleeping for ${ms}ms`);
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
