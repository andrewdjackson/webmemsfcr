import * as Identifier from "./identifiers.js";
import * as Command from "../rosco/mems-commands.js";
import * as View from "./view.js";

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
    }

    return ecuCommand;
}

export function adjustmentReceived(ecuResponse) {
    console.info(`adjustment received ${JSON.stringify(ecuResponse)}`);
    View.showToast(`Adjustment Successful (${JSON.stringify(ecuResponse.response[1])})`);
}

function sendAdjustment(event) {
    let adjustment = event.currentTarget;
    let ecuCommand = getAdjustmentEcuCommand(adjustment.name, adjustment.value);

    if (ecuCommand !== undefined) {
        memsfcr.sendCommand(ecuCommand);
    }
}
