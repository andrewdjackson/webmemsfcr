import * as Identifier from "./identifiers.js";
import * as Command from "../rosco/mems-commands.js";
import * as View from "./view.js";
import * as Dataframe from "./dataframe.js";
import {ecu, sendCommand} from "./memsecu.js";

export function attachControlEventListeners() {
    document.getElementById("connectButton").addEventListener('click', connect);
    document.getElementById("disconnectButton").addEventListener('click', disconnect);
    document.getElementById("pauseButton").addEventListener('click', pause);
    document.getElementById("clearFaultsButton").addEventListener('click', clearFaults);
    document.getElementById("resetECUButton").addEventListener('click', reset);
}

function connect() {
    console.info(`connect`);

    ecu.connect().then((result) => {
        setButtonsOnConnectionState();
    }).catch((error) => {
        console.error(`index.html: connect ${error}`);
    })
}

function disconnect() {
    console.info(`disconnect`);

    Dataframe.stopDataframeLoop();

    ecu.disconnect().then((result) => {
        setButtonsOnConnectionState();
    }).catch((error) => {
        console.error(`index.html: disconnect ${error}`);
    });
}

function pause() {
    console.info(`pause`);
    Dataframe.pauseDataframe();
}


function clearFaults() {
    console.info(`clear`);

    sendCommand(Command.MEMS_ClearFaults);
}

function reset() {
    console.info(`reset`);

    sendCommand(Command.MEMS_ResetECU);
}

export function resetReceived(ecuResponse) {
    console.info(`adjustment received ${JSON.stringify(ecuResponse)}`);

    switch (ecuResponse.command.command ) {
        case Command.MEMS_ClearFaults.command: View.showToast("Cleared Faults");
            break;
        case Command.MEMS_ResetECU.command: View.showToast("Reset ECU");
            break;
    }
}

export function setButtonsOnConnectionState() {
    let control = document.querySelectorAll(`.${Identifier.enabledWhenEcuIsConnected}`);
    for (let i = 0; i < control.length; i++) {
        control[i].disabled = !ecu.isConnected;
    }

    control = document.querySelectorAll(`.${Identifier.enabledWhenEcuIsDisconnected}`);
    for (let i = 0; i < control.length; i++) {
        control[i].disabled = ecu.isConnected;
    }
}

export function setButtonsOnEngineRunning() {
    let control = document.querySelectorAll(`.${Identifier.enabledWhenKeyOnEngineOff}`);
    for (let i = 0; i < control.length; i++) {
        control[i].disabled = ecu.isEngineRunning;
    }
}

