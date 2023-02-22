import {ecu} from "./init.js";
import {connectToSerialPort} from "./controls.js"
import * as Identifier from "./identifiers.js";

var selectedSerialPort = ""
//
// called when the Connect button is clicked on the Serial Port Dialog
//
export function connectLocalSerialPort() {
    if (selectedSerialPort !== "") {
        connectToSerialPort(selectedSerialPort);
    }
}

export async function showSelectSerialPortDialog() {
    let availablePorts = await getAvailableSerialPorts();

    if (availablePorts.length > 0) {
        let modalDialog = document.getElementById(Identifier.selectPortModalId);

        modalDialog.addEventListener('hidden.bs.modal', () => {
            // dialog closed
        });

        let portList = document.getElementById(Identifier.selectPortModalList);
        portList.innerHTML = "";

        availablePorts.forEach((port) => {
            // add ports to the list
            portList.innerHTML += `<a id="port-${port}" class="scenario list-group-item list-group-item-action" data-bs-toggle="list" role="tab">${port}</a>`;
        });

        var triggerTabList = [].slice.call(document.querySelectorAll('#serialPortList a'))
        triggerTabList.forEach(function (triggerEl) {
            var tabTrigger = new bootstrap.Tab(triggerEl)

            triggerEl.addEventListener('click', function (event) {
                event.preventDefault();
                selectedSerialPort = event.currentTarget.innerText;
            })
        })

        let modal = new bootstrap.Modal(modalDialog);
        modal.show();
    }
}

async function getAvailableSerialPorts() {
    let availablePorts = [];

    await ecu._serial.getAvailablePorts().then((ports) => {
        availablePorts = ports.Ports;
    })

    return availablePorts;
}
