import {attachActuatorEventListeners} from "./actuators.js"
import {attachAdjustmentsEventListeners} from "./adjustments.js"
import {attachControlEventListeners} from "./controls.js"
import {ecuDataMetric} from "./identifiers.js";

export function attachEventListeners() {
    attachControlEventListeners();
    attachAdjustmentsEventListeners();
    attachActuatorEventListeners();
}

export function showToast(message) {
    let alertText = window.document.getElementById("command-alert-body");
    alertText.innerHTML = message;

    let toast = new window.bootstrap.Toast(document.querySelector('#command-alert'));
    toast.show();
}

export function updateDataframeTable(df) {
    Object.entries(df).forEach((entry) => {
        const [key, value] = entry;
        let element = document.getElementById(ecuDataMetric + key);
        if (element !== undefined) {
            element.innerHTML = `${value}`;
        }
    });
}




