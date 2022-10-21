import * as View from "./view.js";
import * as Chart from "./charts.js";
import * as Identifier from "./identifiers.js";
import {dataframeLog, ecu, analysis} from "./memsecu.js";

export function dataframeReceived(ecuResponse) {
    console.info(`dataframe received ${JSON.stringify(ecuResponse)}`);
    let df = ecu.generateDataframeFromECUResponse(ecuResponse);

    dataframeLog.addDataframe(df);
    analysis.analyse();

    //updateDataframeTable(df);
    updateDataframeMetrics(df);
    const faults = analysis.faults;
    Chart.updateCharts(df, faults.at(-1));
    View.setButtonsWhenDataHasBeenLogged();
    View.setButtonsOnEngineRunning();
}

//
// update the table in the UI that displays the ECU values
//
export function updateDataframeTable(df) {
    Object.entries(df).forEach((entry) => {
        const [key, value] = entry;
        let element = document.getElementById(`${Identifier.ecuDataMetric}_${key}`);
        if (element !== undefined) {
            element.innerHTML = `${value}`;
        }
    });
}

function updateDataframeMetrics(df) {
    Object.entries(df).forEach((entry) => {
        const [key, value] = entry;
        const metric = `${Identifier.ecuDataMetric}_${key}`;
        updateMetric(metric, value);
    });
}

function updateMetric(metric, value) {
    let elements = document.querySelectorAll(`.${metric}`);
    for (let i = 0; i < elements.length; i++) {
        if (elements[i] !== undefined) {
            elements[i].innerHTML = `${value}`;
        }
    }
}

export function pauseDataframe() {
    let paused = ecu.isPaused;
    ecu.paused = !paused;

    console.log(`paused ${ecu.isPaused}`);
}

export function stopDataframeLoop() {
    ecu.stopDataframeLoop();
}

export function heartbeatReceived(ecuResponse) {
    console.debug(`heartbeat received ${JSON.stringify(ecuResponse)}`);
}
