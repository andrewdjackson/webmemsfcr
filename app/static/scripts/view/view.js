import * as Identifier from "./identifiers.js";
import {dataframeLog, ecu} from "./memsecu.js";

export function showToast(message) {
    let alertText = window.document.getElementById(Identifier.alertToastTextId);
    alertText.innerHTML = message;

    let toast = new window.bootstrap.Toast(document.querySelector(`#${Identifier.alertToastId}`));
    toast.show();
}

export function showTab(tabId) {
    let tab = new window.bootstrap.Tab(document.getElementById(tabId));
    tab.show();
}

export function updateECUID(ecuId) {
    let ecuIdText = document.getElementById(Identifier.ecuId);
    ecuIdText.innerHTML = `ECU ID: ${ecuId}`;
}

//
// enable buttons when data has been logged and the ecu has been disconnected
//
export function setButtonsWhenDataHasBeenLogged() {
    let control = document.querySelectorAll(`.${Identifier.hasLoggedDataClass}`);
    for (let i = 0; i < control.length; i++) {
        control[i].disabled = !(dataframeLog.hasLoggedData && !ecu.isConnected);
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

export function getButtonText(id) {
    let text = "";
    let btn = document.getElementById(id);

    if (btn !== undefined) {
        text = btn.textContent || btn.innerText;
    }

    return text;
}




