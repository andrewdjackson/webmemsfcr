import * as Identifier from "./identifiers.js";
import * as Command from "../rosco/mems-commands.js";
import * as View from "./view.js";
import * as Dataframe from "./dataframe.js";
import * as LocalSerialPort from "./local-serialport.js";
import {ecu, ecuVersion, setECU, isLocal, sendCommand, dataframeLog, responseEventQueue} from "./init.js";

export function attachControlEventListeners() {
    document.getElementById("connectButton").addEventListener('click', connect);
    document.getElementById("disconnectButton").addEventListener('click', disconnect);
    document.getElementById("pauseButton").addEventListener('click', pause);
    document.getElementById("clearFaultsButton").addEventListener('click', clearFaults);
    document.getElementById("resetECUButton").addEventListener('click', reset);
    document.getElementById("downloadLogButton").addEventListener('click', downloadLog);

    if (isLocal) {
        document.getElementById("selectPortConnectButton").addEventListener('click', LocalSerialPort.connectLocalSerialPort);
    } else {
        document.getElementById("versionButton").addEventListener('change', selectEcuVersion, false);
    }
}

function connect() {
    console.info(`connect`);

    if (isLocal) {
        LocalSerialPort.showSelectSerialPortDialog();
    } else {
        connectToSerialPort();
    }
}

export function connectToSerialPort(port) {
    ecu.connect(port).then((connected) => {
        if (connected === true) {
            View.setButtonsOnConnectionState();
            View.updateECUID(ecu.ecuId);
            // load a page into the hidden iframe for verion tracking
            loadEcuVersionTracking();
        } else {
            showConnectErrorDialog();
        }
    }).catch((error) => {
        console.error(`index.html: connect ${error}`);
    })
}

function disconnect() {
    console.info(`disconnect`);

    Dataframe.stopDataframeLoop();

    ecu.disconnect().then(() => {
        View.setButtonsOnConnectionState();
        View.setButtonsWhenDataHasBeenLogged();
    }).catch((error) => {
        console.error(`index.html: disconnect ${error}`);
    });
}

function pause() {
    console.info(`pause (${ecu.isPaused})`);
    Dataframe.pauseDataframe();

    let pauseButton = document.getElementById("pauseButton");
    if (ecu.isPaused) {
        pauseButton.innerText = "Resume";
        pauseButton.classList.remove("btn-warning");
        pauseButton.classList.add("btn-info");
    } else {
        pauseButton.innerText = "Pause";
        pauseButton.classList.remove("btn-info");
        pauseButton.classList.add("btn-warning");
    }
}


function clearFaults() {
    console.info(`clear`);

    sendCommand(Command.MEMS_ClearFaults);
}

function reset() {
    console.info(`reset`);

    sendCommand(Command.MEMS_ResetECU);
}

function downloadLog() {
    console.info(`download csv`);

    dataframeLog.downloadCSVFile(ecu.ecuId);
}

function showConnectErrorDialog() {
    document.getElementById(Identifier.messageModalTitleId).textContent = "Unable to Connect to ECU"
    document.getElementById(Identifier.messageModalTextId).innerHTML = "<p>Web MemsFCR was unable to connect to the ECU</p><ol><li>Check Diagnostic Cable is connected correctly and ignition is On.</li><li>Check that you have selected the  correct Serial Port.</li><li>If the connection fails again, reload this page</li></ol>"

    let modalDialog = document.getElementById(Identifier.messageModalId);
    modalDialog.addEventListener('hidden.bs.modal', () => {
        console.warn('reloading browser');
        document.location.reload();
    });

    let modal = new bootstrap.Modal(modalDialog);
    modal.show();
}

function selectEcuVersion(event) {
    let ecuVersion = event.target.options[event.target.selectedIndex].value;
    setECU(ecuVersion);
}

function loadEcuVersionTracking() {
    let ecuTrackingPage = "ecuSPITracking";

    if (ecuVersion === "1.9") {
        ecuTrackingPage = "ecuMPITracking"
    }

    try {
        document.getElementById('ecuVersionSelectedTracking').src = `/static/templates/${ecuTrackingPage}.html?version=${ecuVersion}`;
    } catch (e) {
        console.warn(`unable to load ecuVersion tracking page ${e}`);
    }
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





