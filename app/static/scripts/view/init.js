import {EventQueue, EventTopic} from "../rosco/mems-queue.js";
import {MemsBrowserSerialInterface} from "../rosco/mems-browser-serial.js";
import {MemsEcu16} from "../rosco/mems-ecu16.js";
import {DataframeLog} from "../rosco/mems-dataframe-log.js";
import {Analysis} from "../analysis/analysis.js";
import {AnalysisReport} from "./analysis-report.js";

import * as Dataframe from "./dataframe.js";
import * as Actuator from "./actuators.js";
import * as Adjustment from "./adjustments.js";
import * as Controls from "./controls.js";
import * as Chart from "./charts.js";
import * as View from "./view.js";

export const responseEventQueue = new EventQueue();
export var ecu = undefined;
export const dataframeLog = new DataframeLog();
export const analysis = new Analysis(dataframeLog);
export const analysisReport = new AnalysisReport(analysis);
export var charts = [];
export var initialised = false;
export var isLocal = false;

export async function initialise(serialInterface) {
    if (!initialised) {
        // prevent initialisation occurring more than once.
        initialised = true;

        if (serialInterface === undefined) {
            ecu = new MemsEcu16(responseEventQueue, new MemsBrowserSerialInterface());
        } else {
            ecu = new MemsEcu16(responseEventQueue, serialInterface);
        }

        initialiseSubscribers();

        // create the charts and then show the ecu data tab
        // rendering of the charts gets deferred which interrupts the js loop
        // causing serial errors.
        Chart.createCharts();
        Chart.createSparks();

        View.showTab('nav-dashboard-tab');

        Controls.attachControlEventListeners();
        Adjustment.attachAdjustmentsEventListeners();
        Actuator.attachActuatorEventListeners();
        View.attachTabEventListeners();
        View.setButtonsOnConnectionState();
        View.setButtonsOnEngineRunning();
    }
}

export function setRunningLocal() {
    isLocal = true;
}

function initialiseSubscribers() {
    responseEventQueue.subscribe(EventTopic.Dataframe, Dataframe.dataframeReceived);
    responseEventQueue.subscribe(EventTopic.Heartbeat, Dataframe.heartbeatReceived);
    responseEventQueue.subscribe(EventTopic.Actuator, Actuator.actuatorReceived);
    responseEventQueue.subscribe(EventTopic.Adjustment, Adjustment.adjustmentReceived);
    responseEventQueue.subscribe(EventTopic.Reset, Controls.resetReceived);
}

export function sendCommand(ecuCommand) {
    // send the command to the top of the queue
    // this ensures that it gets serviced next
    ecu.addCommandToSendQueue(ecuCommand, true);
}
