import * as Identifier from "./identifiers.js";
import * as View from "./view.js";
import {sendCommand} from "./init.js";
import * as Command from "../../../../app/static/scripts/rosco/mems-1x/mems-commands.js";

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

export function getActuatorEcuCommand(actuator, operation) {
    let ecuCommand;

    switch (actuator) {
        case Identifier.actuatorTempGauge:
            if (operation === Identifier.activateActuator) {
                ecuCommand = Command.MEMS_CoolantGauge_Activate;
            } else {
                ecuCommand = Command.MEMS_CoolantGauge_Deactivate;
            }
            break;

        case Identifier.actuatorFuelPump:
            if (operation === Identifier.activateActuator) {
                ecuCommand = Command.MEMS_FuelPump_Activate;
            } else {
                ecuCommand = Command.MEMS_FuelPump_Deactivate;
            }
            break;

        case Identifier.actuatorPTC:
            if (operation === Identifier.activateActuator) {
                ecuCommand = Command.MEMS_PTC_Activate;
            } else {
                ecuCommand = Command.MEMS_PTC_Deactivate;
            }
            break;

        case Identifier.actuatorAirCon:
            if (operation === Identifier.activateActuator) {
                ecuCommand = Command.MEMS_AirCon_Activate;
            } else {
                ecuCommand = Command.MEMS_AirCon_Deactivate;
            }
            break;

        case Identifier.actuatorPurgeValve:
            if (operation === Identifier.activateActuator) {
                ecuCommand = Command.MEMS_PurgeValve_Activate;
            } else {
                ecuCommand = Command.MEMS_PurgeValve_Deactivate;
            }
            break;

        case Identifier.actuatorLambdaHeater:
            if (operation === Identifier.activateActuator) {
                ecuCommand = Command.MEMS_LambdaHeater_Activate;
            } else {
                ecuCommand = Command.MEMS_LambdaHeater_Deactivate;
            }
            break;

        case Identifier.actuatorFan1:
            if (operation === Identifier.activateActuator) {
                ecuCommand = Command.MEMS_Fan1_Activate;
            } else {
                ecuCommand = Command.MEMS_Fan1_Deactivate;
            }
            break;

        case Identifier.actuatorFan2:
            if (operation === Identifier.activateActuator) {
                ecuCommand = Command.MEMS_Fan2_Activate;
            } else {
                ecuCommand = Command.MEMS_Fan2_Deactivate;
            }
            break;

        case Identifier.actuatorInjector:
            ecuCommand = Command.MEMS_Injector_Activate;
            break;

        case Identifier.actuatorCoil:
            ecuCommand = Command.MEMS_Coil_Activate;
            break;

        case Identifier.actuatorRpmGauge:
            if (operation === Identifier.activateActuator) {
                ecuCommand = Command.MEMS_RPMGauge_Activate;
            } else {
                ecuCommand = Command.MEMS_RPMGauge_Deactivate;
            }
            break;

        default:
            console.error(`unknown actuator command ${actuator}`);
    }

    return ecuCommand;
}

export function actuatorReceived(ecuResponse) {
    console.info(`actuator received ${JSON.stringify(ecuResponse)}`);
    View.showToast(`Actuator Successful (${JSON.stringify(ecuResponse.response[1])})`)

    let actuator;
    let activated = false;

    console.info(`actuator received ${JSON.stringify(ecuResponse)}`);

    switch (ecuResponse.response[0]) {
        case Command.MEMS_CoolantGauge_Activate.command:
            activated = true;
        case Command.MEMS_CoolantGauge_Deactivate.command:
            actuator = View.getButtonText(Identifier.actuatorTempGauge);
            break;

        case Command.MEMS_FuelPump_Activate.command:
            activated = true;
        case Command.MEMS_FuelPump_Deactivate.command:
            actuator = View.getButtonText(Identifier.actuatorFuelPump);
            break;

        case Command.MEMS_PTC_Activate.command:
            activated = true;
        case Command.MEMS_PTC_Deactivate.command:
            actuator = View.getButtonText(Identifier.actuatorPTC);
            break;

        case Command.MEMS_AirCon_Activate.command:
            activated = true;
        case Command.MEMS_AirCon_Deactivate.command:
            actuator = View.getButtonText(Identifier.actuatorAirCon);
            break;

        case Command.MEMS_PurgeValve_Activate.command:
            activated = true;
        case Command.MEMS_PurgeValve_Deactivate.command:
            actuator = View.getButtonText(Identifier.actuatorPurgeValve);
            break;

        case Command.MEMS_LambdaHeater_Activate.command:
            activated = true;
        case Command.MEMS_LambdaHeater_Deactivate.command:
            actuator = View.getButtonText(Identifier.actuatorLambdaHeater);
            break;

        case Command.MEMS_Fan1_Activate.command:
            activated = true;
        case Command.MEMS_Fan1_Deactivate.command:
            actuator = View.getButtonText(Identifier.actuatorFan1);
            break;

        case Command.MEMS_Fan2_Activate.command:
            activated = true;
        case Command.MEMS_Fan2_Deactivate.command:
            actuator = View.getButtonText(Identifier.actuatorFan2);
            break;

        case Command.MEMS_Injector_Activate.command:
            activated = true;
            actuator = View.getButtonText(Identifier.actuatorInjector);
            break;

        case Command.MEMS_Coil_Activate.command:
            activated = true;
            actuator = View.getButtonText(Identifier.actuatorCoil);
            break;

        case Command.MEMS_RPMGauge_Activate.command:
            activated = true;
        case Command.MEMS_RPMGauge_Deactivate.command:
            actuator = View.getButtonText(Identifier.actuatorRpmGauge);
            break;
    }

    if (activated) {
        View.showToast(`${actuator} Activated`);
    } else {
        View.showToast(`${actuator} Deactivated`);
    }
}

function sendActuator(event) {
    let actuator = event.currentTarget;

    let ecuCommand = getActuatorEcuCommand(actuator.name, actuator.value);

    if (ecuCommand !== undefined) {
        sendCommand(ecuCommand);
    }

    console.info(`${actuator.name}`);
}
