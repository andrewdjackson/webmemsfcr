import * as Identifier from "./identifiers.js";
import * as View from "./view.js";

export function attachActuatorEventListeners() {
    let actuator = document.querySelectorAll(`.${Identifier.actuatorClass}`);
    for (let i = 0; i < actuator.length; i++) {
        actuator[i].addEventListener('click', sendActuator);
    }
}

export function enableActuators(enabled) {
    let actuators = document.querySelectorAll(`.${Identifier.actuatorClass}`);
    for (let i = 0; i < actuators.length; i++) {
        actuators[i].disabled = enabled;
    }
}

export function actuatorReceived(ecuResponse) {
    console.info(`actuator received ${JSON.stringify(ecuResponse)}`);
    View.showToast(`Actuator Successful (${JSON.stringify(ecuResponse.response[1])})`)
}

function sendActuator(event) {
    let actuator = event.currentTarget;
    console.info(`${actuator.name}`);
}
