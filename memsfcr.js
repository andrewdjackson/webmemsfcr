import {ECUCommand, MEMS_ClearFaults, MEMS_ResetECU} from "./static/scripts/rosco/mems-commands.js";
import {MemsEcu16} from "./static/scripts/rosco/mems-ecu16.js";
import {EventTopic, EventQueue} from "./static/scripts/rosco/mems-queue.js";
import * as Command from "./static/scripts/rosco/mems-commands.js";

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
        this.q.subscribe(EventTopic.Reset, this.resetReceived.bind(this));
    }

    connect() {
        this.e.Connect()
            .then((result) => {
                console.log(`index.html: connect ${result}`);
            })
            .catch((error) => {
                console.error(`index.html: connect ${error}`);
            });
    }

    disconnect() {
        this.e.StopDataframeLoop();

        this.e.Disconnect()
            .then((result) => {
                console.log(`index.html: disconnected (connected ${result})`);
            })
            .catch((error) => {
                console.error(`index.html: disconnect ${error}`);
            });
    }

    pauseDataframe() {
        this.e.paused = !this.e.paused;
        console.log(`paused ${this.e.paused}`);
        /*
        if (this.e.paused) {
            this.e.paused = false;
        } else {
            this.e.paused = true;
        }*/
    }

    clearFaults() {
        this.sendCommand(Command.MEMS_ClearFaults);
    }

    resetECU() {
        this.sendCommand(Command.MEMS_ResetECU);
    }

    sendCommand(ecuCommand) {
        this.e.AddCommandToSendQueue(ecuCommand, true);
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
        let df = this.e.GenerateDataframeFromECUResponse(ecuResponse);
        this.updateTable(df);
    }

    heartbeatReceived(ecuResponse) {
        console.log(`heartbeat received ${JSON.stringify(ecuResponse)}`);
    }

    actuatorReceived(ecuResponse) {
        console.log(`actuator received ${JSON.stringify(ecuResponse)}`);
    }

    resetReceived(ecuResponse) {
        let alertDiv = window.document.getElementById("commands-alert");
        switch (ecuResponse.command.command ) {
            case MEMS_ClearFaults.command: alertDiv.innerHTML = "Cleared Faults";
            break;
            case MEMS_ResetECU.command: alertDiv.innerHTML = "Reset ECU";
            break;
        }
        setTimeout(function() {
            let alertDiv = window.document.getElementById("commands-alert");
            alertDiv.alert('close');
        }, 2000);
    }
}
