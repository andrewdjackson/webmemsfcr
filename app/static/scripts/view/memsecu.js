import {EventQueue, EventTopic} from "../rosco/mems-queue.js";
import {MemsEcu16} from "../rosco/mems-ecu16.js";
import {DataframeLog} from "../rosco/mems-dataframe.js";

import * as Dataframe from "./dataframe.js";
import * as Actuator from "./actuators.js";
import * as Adjustment from "./adjustments.js";
import * as Controls from "./controls.js";

export const responseEventQueue = new EventQueue();
export const ecu = new MemsEcu16(responseEventQueue);
export const dataframeLog = new DataframeLog();
export var initialised = false;

export function initialise() {
    if (!initialised) {
        // prevent initialisation occurring more than once.
        initialised = true;

        initialiseSubscribers();

        Controls.attachControlEventListeners();
        Adjustment.attachAdjustmentsEventListeners();
        Actuator.attachActuatorEventListeners();

        Controls.setButtonsOnConnectionState();
        Controls.setButtonsOnEngineRunning();
    }
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