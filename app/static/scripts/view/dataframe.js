import * as View from "./view.js";
import * as Chart from "./charts.js";
import * as Identifier from "./identifiers.js";
import {dataframeLog, ecu, analysis} from "./memsecu.js";

export function dataframeReceived(ecuResponse) {
    console.info(`dataframe received ${JSON.stringify(ecuResponse)}`);
    let df = ecu.generateDataframeFromECUResponse(ecuResponse);

    // add the dataframe to the log
    dataframeLog.addDataframe(df);
    // analyse for faults and operation status
    analysis.analyse();
    const faults = analysis.faults;

    // set buttons based on state
    View.setButtonsWhenDataHasBeenLogged();
    View.setButtonsOnEngineRunning();

    // update the values in the UI
    updateDataframeMetrics(df);

    // update the charts
    Chart.updateCharts(df, faults.at(-1));
}

//
// update the table in the UI that displays the ECU values
//
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
