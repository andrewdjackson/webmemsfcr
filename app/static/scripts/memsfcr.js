import {MemsEcu16} from "./rosco/mems-ecu16.js";
import {EventTopic, EventQueue} from "./rosco/mems-queue.js";
import * as Command from "./rosco/mems-commands.js";
import * as Adjustment from "./view/adjustments.js";
import * as Controls from "./view/controls.js";
import * as View from "./view/view.js";

export class Memsfcr {
    constructor() {
        this.q = new EventQueue();
        this.initialiseSubscribers();
        this.e = new MemsEcu16(this.q);
    }

    initialiseSubscribers() {
        this.q.subscribe(EventTopic.Dataframe, this.dataframeReceived.bind(this));
        this.q.subscribe(EventTopic.Heartbeat, this.heartbeatReceived.bind(this));
        this.q.subscribe(EventTopic.Actuator, this.actuatorReceived.bind(this));
        this.q.subscribe(EventTopic.Adjustment, Adjustment.adjustmentReceived.bind(this));
        this.q.subscribe(EventTopic.Reset, this.resetReceived.bind(this));
    }

    get isConnected() {
        return this.e.isConnected;
    }

    get isEngineRunning() {
        return this.e.isEngineRunning;
    }

    connect() {
        return this.e.connect()
            .then((result) => {
                console.info(`index.html: connect ${result}`);
            })
            .catch((error) => {
                console.error(`index.html: connect ${error}`);
            });
    }

    disconnect(callback) {
        this.e.stopDataframeLoop();

        return this.e.disconnect()
            .then((result) => {
                console.info(`index.html: disconnected (connected ${result})`);
            })
            .catch((error) => {
                console.error(`index.html: disconnect ${error}`);
            });
    }

    pauseDataframe() {
        let paused = this.e.isPaused;
        this.e.paused = !paused;
        console.log(`paused ${this.e.isPaused}`);
    }

    clearFaults() {
        this.sendCommand(Command.MEMS_ClearFaults);
    }

    resetECU() {
        this.sendCommand(Command.MEMS_ResetECU);
    }

    sendCommand(ecuCommand) {
        // send the command to the top of the queue
        // this ensures that it gets serviced next
        this.e.addCommandToSendQueue(ecuCommand, true);
    }

    dataframeReceived(ecuResponse) {
        console.info(`dataframe received ${JSON.stringify(ecuResponse)}`);
        let df = this.e.generateDataframeFromECUResponse(ecuResponse);
        View.updateDataframeTable(df);
        Controls.setButtonsOnEngineRunning();
    }

    heartbeatReceived(ecuResponse) {
        console.debug(`heartbeat received ${JSON.stringify(ecuResponse)}`);
    }

    actuatorReceived(ecuResponse) {
        console.info(`actuator received ${JSON.stringify(ecuResponse)}`);
        View.showToast(`Actuator Successful (${JSON.stringify(ecuResponse.response[1])})`)
    }

    adjustmentReceived(ecuResponse) {
        console.info(`adjustment received ${JSON.stringify(ecuResponse)}`);
        View.showToast(`Adjustment Successful (${JSON.stringify(ecuResponse.response[1])})`);
    }

    resetReceived(ecuResponse) {
        console.info(`adjustment received ${JSON.stringify(ecuResponse)}`);

        switch (ecuResponse.command.command ) {
            case Command.MEMS_ClearFaults.command: View.showToast("Cleared Faults");
                break;
            case Command.MEMS_ResetECU.command: View.showToast("Reset ECU");
                break;
        }
    }
}
