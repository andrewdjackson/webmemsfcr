import {MEMS_ClearFaults, MEMS_ResetECU} from "./rosco/mems-commands.js";
import {MemsEcu16} from "./rosco/mems-ecu16.js";
import {EventTopic, EventQueue} from "./rosco/mems-queue.js";
import * as Command from "./rosco/mems-commands.js";
import {MemsEcu13} from "./rosco/mems-ecu13.js";
import * as bootstrap from 'bootstrap';

export class Memsfcr {
    constructor() {
        this.q = new EventQueue();
        this.initialiseSubscribers();
        this.e = new MemsEcu16(this.q);

        this.createTable();
    }

    initialiseSubscribers() {
        this.q.subscribe(EventTopic.Dataframe, this.dataframeReceived.bind(this));
        this.q.subscribe(EventTopic.Heartbeat, this.heartbeatReceived.bind(this));
        this.q.subscribe(EventTopic.Actuator, this.actuatorReceived.bind(this));
        this.q.subscribe(EventTopic.Reset, this.resetReceived.bind(this));
    }

    connect(callback) {
        this.e.connect()
            .then((result) => {
                console.log(`index.html: connect ${result}`);
                callback(this.e.isConnected);
            })
            .catch((error) => {
                console.error(`index.html: connect ${error}`);
            });
    }

    disconnect(callback) {
        this.e.stopDataframeLoop();

        this.e.disconnect()
            .then((result) => {
                console.log(`index.html: disconnected (connected ${result})`);
                callback(this.e.isConnected);
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

    createTable() {
        var table = window.document.getElementById("df80table");
        var data = new Command.Dataframe80();
        Object.keys(data).sort().forEach(
            function(key) {
                table.innerHTML += `<td>${key}</td><td id="ecudata${key}">${data[key]}</td>`;
            });

        table = window.document.getElementById("df7dtable");
        data = new Command.Dataframe7d();
        Object.keys(data).sort().forEach(
            function(key) {
                table.innerHTML += `<td>${key}</td><td id="ecudata${key}">${data[key]}</td>`;
            });
    }

    updateTable(df) {
        Object.entries(df).forEach((entry) => {
            const [key, value] = entry;
            let element = window.document.getElementById("ecudata" + key);
            element.innerHTML = `${value}`;
        });
    }

    dataframeReceived(ecuResponse) {
        console.log(`dataframe received ${JSON.stringify(ecuResponse)}`);
        let df = this.e.generateDataframeFromECUResponse(ecuResponse);
        this.updateTable(df);
    }

    heartbeatReceived(ecuResponse) {
        console.log(`heartbeat received ${JSON.stringify(ecuResponse)}`);
    }

    actuatorReceived(ecuResponse) {
        console.log(`actuator received ${JSON.stringify(ecuResponse)}`);
    }

    resetReceived(ecuResponse) {
        let alertText = window.document.getElementById("command-alert-body");

        switch (ecuResponse.command.command ) {
            case MEMS_ClearFaults.command: alertText.innerHTML = "Cleared Faults";
                break;
            case MEMS_ResetECU.command: alertText.innerHTML = "Reset ECU";
                break;
        }

        let toast = new window.bootstrap.Toast(document.querySelector('#command-alert'));
        toast.show();
    }
}
