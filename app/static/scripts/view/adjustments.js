import * as Identifier from "./identifiers.js";
import * as Command from "../rosco/mems-1x/mems-commands.js";
import * as View from "./view.js";
import {sendCommand} from "./init.js";

export function attachAdjustmentsEventListeners() {
    let adjustment = document.querySelectorAll(`.${Identifier.adjustmentClass}`);
    for (let i = 0; i < adjustment.length; i++) {
        adjustment[i].addEventListener('click', sendAdjustment);
    }
}

export function getAdjustmentEcuCommand(adjustment, operation) {
    let ecuCommand;

    switch (adjustment) {
        case Identifier.adjustIdleSpeedOffset:
            if (operation === Identifier.increaseAdjustment) {
                ecuCommand = Command.MEMS_IdleSpeed_Inc;
            } else {
                ecuCommand = Command.MEMS_IdleSpeed_Dec;
            }
            break;

        case Identifier.adjustIdleIAC:
            if (operation === Identifier.increaseAdjustment) {
                ecuCommand = Command.MEMS_IAC_Inc;
            } else {
                ecuCommand = Command.MEMS_IAC_Dec;
            }
            break;

        case Identifier.adjustIdleHot:
            if (operation === Identifier.increaseAdjustment) {
                ecuCommand = Command.MEMS_HotIdle_Inc;
            } else {
                ecuCommand = Command.MEMS_HotIdle_Dec;
            }
            break;

        case Identifier.adjustSTFT:
            if (operation === Identifier.increaseAdjustment) {
                ecuCommand = Command.MEMS_STFT_Inc;
            } else {
                ecuCommand = Command.MEMS_STFT_Dec;
            }
            break;

        case Identifier.adjustLTFT:
            if (operation === Identifier.increaseAdjustment) {
                ecuCommand = Command.MEMS_LTFT_Inc;
            } else {
                ecuCommand = Command.MEMS_LTFT_Dec;
            }
            break;

        case Identifier.adjustIgnitionAdvance:
            if (operation === Identifier.increaseAdjustment) {
                ecuCommand = Command.MEMS_IgnAdvance_Inc;
            } else {
                ecuCommand = Command.MEMS_IgnAdvance_Dec;
            }
            break;

        default:
            console.error(`unknown adjustment command ${adjustment}`);
    }

    return ecuCommand;
}

//
// show a notification when a response has been received for an adjustment command
//
export function adjustmentReceived(ecuResponse) {
    let adjustment;

    console.info(`adjustment received ${JSON.stringify(ecuResponse)}`);

    switch (ecuResponse.response[0]) {
        case Command.MEMS_IdleSpeed_Inc.command:
        case Command.MEMS_IdleSpeed_Dec.command: adjustment = View.getButtonText(Identifier.adjustIdleSpeedOffset);
            break;

        case Command.MEMS_IAC_Inc.command:
        case Command.MEMS_IAC_Dec.command: adjustment = View.getButtonText(Identifier.adjustIdleIAC);
            break;

        case Command.MEMS_HotIdle_Inc.command:
        case Command.MEMS_HotIdle_Dec.command: adjustment = View.getButtonText(Identifier.adjustIdleHot);
            break;

        case Command.MEMS_STFT_Inc.command:
        case Command.MEMS_STFT_Dec.command: adjustment = View.getButtonText(Identifier.adjustSTFT);
            break;

        case Command.MEMS_LTFT_Inc.command:
        case Command.MEMS_LTFT_Dec.command: adjustment = View.getButtonText(Identifier.adjustLTFT);
            break;

        case Command.MEMS_IgnAdvance_Inc.command:
        case Command.MEMS_IgnAdvance_Dec.command: adjustment = View.getButtonText(Identifier.adjustIgnitionAdvance);
            break;
    }

    View.showToast(`${adjustment} Adjustment Successful (${JSON.stringify(ecuResponse.response[1])})`);
}

function sendAdjustment(event) {
    let adjustment = event.currentTarget;
    let ecuCommand = getAdjustmentEcuCommand(adjustment.name, adjustment.value);

    if (ecuCommand !== undefined) {
        sendCommand(ecuCommand);
    }
}
