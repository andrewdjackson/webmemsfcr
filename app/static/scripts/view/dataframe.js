import * as View from "./view.js";
import * as Controls from "./controls.js";
import {ecu} from "./memsecu.js";

export function dataframeReceived(ecuResponse) {
    console.info(`dataframe received ${JSON.stringify(ecuResponse)}`);
    let df = ecu.generateDataframeFromECUResponse(ecuResponse);
    View.updateDataframeTable(df);
    Controls.setButtonsOnEngineRunning();
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
