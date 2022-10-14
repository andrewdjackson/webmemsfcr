import * as View from "./view.js";
import * as Chart from "./charts.js";
import * as Identifier from "./identifiers.js";
import {dataframeLog, ecu} from "./memsecu.js";

export function dataframeReceived(ecuResponse) {
    console.info(`dataframe received ${JSON.stringify(ecuResponse)}`);
    let df = ecu.generateDataframeFromECUResponse(ecuResponse);
    updateDataframeTable(df);
    Chart.updateCharts(df);
    View.setButtonsWhenDataHasBeenLogged();
    View.setButtonsOnEngineRunning();

    dataframeLog.addDataframe(df);
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
