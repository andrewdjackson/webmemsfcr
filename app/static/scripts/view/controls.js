import {enabledWhenEcuIsConnected, enabledWhenEcuIsDisconnected, enabledWhenKeyOnEngineOff} from "./identifiers.js";

export function attachControlEventListeners() {
    document.getElementById("connectButton").addEventListener('click', connect);
    document.getElementById("disconnectButton").addEventListener('click', disconnect);
    document.getElementById("pauseButton").addEventListener('click', pause);
    document.getElementById("clearFaultsButton").addEventListener('click', clearFaults);
    document.getElementById("resetECUButton").addEventListener('click', reset);
}

function connect() {
    console.info(`connect`);

    memsfcr.connect().then((result) => {
        setButtonsOnConnectionState();
    })
}

function disconnect() {
    console.info(`disconnect`);

    memsfcr.disconnect().then((result) => {
        setButtonsOnConnectionState();
    })
}

function pause() {
    console.info(`pause`);

    memsfcr.pauseDataframe();
}

function clearFaults() {
    console.info(`clear`);

    memsfcr.clearFaults();
}

function reset() {
    console.info(`reset`);

    memsfcr.resetECU();
}

export function setButtonsOnConnectionState() {
    let control = document.querySelectorAll(`.${enabledWhenEcuIsConnected}`);
    for (let i = 0; i < control.length; i++) {
        control[i].disabled = !memsfcr.isConnected;
    }

    control = document.querySelectorAll(`.${enabledWhenEcuIsDisconnected}`);
    for (let i = 0; i < control.length; i++) {
        control[i].disabled = memsfcr.isConnected;
    }
}

export function setButtonsOnEngineRunning() {
    let control = document.querySelectorAll(`.${enabledWhenKeyOnEngineOff}`);
    for (let i = 0; i < control.length; i++) {
        control[i].disabled = memsfcr.isEngineRunning;
    }
}

