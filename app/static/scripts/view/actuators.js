import {actuatorClass} from "./identifiers.js";

export function attachActuatorEventListeners() {
    let actuator = document.querySelectorAll(`.${actuatorClass}`);
    for (let i = 0; i < actuator.length; i++) {
        actuator[i].addEventListener('click', sendActuator);
    }
}

export function enableActuators(enabled) {
    let actuators = document.querySelectorAll(`.${actuatorClass}`);
    for (let i = 0; i < actuators.length; i++) {
        actuators[i].disabled = enabled;
    }
}

function sendActuator(event) {
    let actuator = event.currentTarget;
    console.info(`${actuator.name}`);
}
