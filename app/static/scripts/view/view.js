import * as Identifier from "./identifiers.js";

export function showToast(message) {
    let alertText = window.document.getElementById(Identifier.alertToastTextId);
    alertText.innerHTML = message;

    let toast = new window.bootstrap.Toast(document.querySelector(`#${Identifier.alertToastId}`));
    toast.show();
}

export function updateDataframeTable(df) {
    Object.entries(df).forEach((entry) => {
        const [key, value] = entry;
        let element = document.getElementById(Identifier.ecuDataMetric + key);
        if (element !== undefined) {
            element.innerHTML = `${value}`;
        }
    });
}




