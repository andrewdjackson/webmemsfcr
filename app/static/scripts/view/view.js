import * as Identifier from "./identifiers.js";
import {ecu, dataframeLog, charts} from "./memsecu.js";
import * as Chart from "./charts.js";

export function showToast(message) {
    let alertText = window.document.getElementById(Identifier.alertToastTextId);
    alertText.innerHTML = message;

    let toast = new window.bootstrap.Toast(document.querySelector(`#${Identifier.alertToastId}`));
    toast.show();
}

export function updateDataframeTable(df) {
    Object.entries(df).forEach((entry) => {
        const [key, value] = entry;
        let element = document.getElementById(`${Identifier.ecuDataMetric}_${key}`);
        if (element !== undefined) {
            element.innerHTML = `${value}`;
        }
    });
}

export function updateECUID(ecuId) {
    let ecuIdText = document.getElementById(Identifier.ecuId);
    ecuIdText.innerHTML = `ECU ID: ${ecuId}`;
}

export function updateCharts(df) {
    let time = df[Identifier.ecuDataTimeMetric80];
    if (time === undefined) {
        time = df[Identifier.ecuDataTimeMetric7d];
    }

    Object.entries(df).forEach((entry) => {
        const [key, value] = entry;
        let chartId = `${key}_${Identifier.ecuDataChart}`;
        let chart = Chart.findChart(chartId);
        let fault = false;

        if (chart !== undefined) {
            Chart.addData(chart, time, value, fault);
        }
    });
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

export function getButtonText(id) {
    let text = "";
    let btn = document.getElementById(id);

    if (btn !== undefined) {
        text = btn.textContent || btn.innerText;
    }

    return text;
}




