import * as Identifier from "./identifiers.js";
import * as Chart from "./charts.js";
import {analysis, dataframeLog, ecu, charts} from "./memsecu.js";
import {findChart} from "./charts.js";
import * as Analysis from "./analysis.js";

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
// call analysis endpoint for rendering of the templates in python
//
export async function displayAnalysis() {
    Analysis.updateFaultReport();

    let dataframes = [];

    // strip out everything except the raw data
    analysis.dataframes.forEach((item) => {
        let dataframe = {};
        dataframe['Time'] = item._80x00_Time;
        dataframe['Dataframe80'] = item._80_RawData;
        dataframe['Dataframe7d'] = item._7D_RawData;
        dataframes.push(dataframe);
    });

    let body = {
        dataframes: dataframes
    }

    return SendRequest('POST', "./analysis", body)
        .then(response => _analysisResponse(response));
}

async function _analysisResponse(response) {
    document.getElementById("analysis").innerHTML = response;
    await updateAnalysisCharts();
}


//
// iterate the charts in the analysis report and update the chart images
// from the dynamic charts
//
async function updateAnalysisCharts() {
    let images = document.querySelectorAll(`.${Identifier.analysisClass}`);
    for (let i = 0; i < images.length; i++) {
        let classes = images[i].className.split(' ');
        let id = classes[1];
        let chartId = `${Identifier.ecuDataChart} ${id}`;

        const chart = findChart(chartId);
        if (chart !== undefined) {
            let image = await Chart.getChartAsImage(id);
            if (image !== undefined) {
                images[i].src = image;
            }
        }
    }
}

//
// enable buttons when data has been logged and the ecu has been disconnected
//

export function attachTabEventListeners(){
    document.getElementById("nav-analysis-tab").addEventListener('click', displayAnalysis);
}

export function setButtonsWhenDataHasBeenLogged() {
    let control = document.querySelectorAll(`.${Identifier.hasLoggedDataClass}`);
    for (let i = 0; i < control.length; i++) {
        control[i].disabled = !(dataframeLog.hasLoggedData);
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

async function SendRequest(method, endpoint, body) {
    let init = {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }

    const response = await fetch(endpoint, init);

    if (!response.ok) {
        let message = `${endpoint} failed with status ${response.status}`;
        console.error(message);
    }

    return await response.text();
}



