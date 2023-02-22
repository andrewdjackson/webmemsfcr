import {EventQueue, EventTopic} from "../rosco/mems-queue.js";
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
export const ecu = new MemsEcu16(responseEventQueue);
export const dataframeLog = new DataframeLog();
export const analysis = new Analysis(dataframeLog);
export const analysisReport = new AnalysisReport(analysis);
export var charts = [];
export var initialised = false;

const templates = ['footer','dashboard','actuators','adjustments','ecudata','charts','analysis','guidance'];

export async function initialise() {
    if (!initialised) {
        // prevent initialisation occurring more than once.
        initialised = true;

        // load the templates before initialising event handlers
        await loadTemplates();

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

function initialiseSubscribers() {
    responseEventQueue.subscribe(EventTopic.Dataframe, Dataframe.dataframeReceived);
    responseEventQueue.subscribe(EventTopic.Heartbeat, Dataframe.heartbeatReceived);
    responseEventQueue.subscribe(EventTopic.Actuator, Actuator.actuatorReceived);
    responseEventQueue.subscribe(EventTopic.Adjustment, Adjustment.adjustmentReceived);
    responseEventQueue.subscribe(EventTopic.Reset, Controls.resetReceived);
}

async function loadTemplates() {
    const templateBaseUrl = '/static/templates';
    let templateUrls = []
    for (let i=0; i < templates.length; i++) {
        const url = `${templateBaseUrl}/${templates[i]}.html`;
        templateUrls.push(url);
    }

    for (let i=0; i < templates.length; i++) {
        await fetch(templateUrls[i])
            .then((response) =>{
                response.text().then((text) => {
                    let target = document.getElementById(`template-${templates[i]}`);
                    if (target !== null) {
                        target.innerHTML = text;
                    }
                });
            })
            .catch(function(err) {console.warn(`Failed to fetch template ${templateUrls[i]} (${err})`);
            });
    }
}

export function sendCommand(ecuCommand) {
    // send the command to the top of the queue
    // this ensures that it gets serviced next
    ecu.addCommandToSendQueue(ecuCommand, true);
}
