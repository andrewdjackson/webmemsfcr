//
// Local Initialisation is called by index.html which is served by the go webserver
// this is used to set up differences in the environments before the commmon
// initialisation is executed
//

import {initialise, setRunningLocal} from "./init.js";
import {MemsLocalSerialInterface} from "../rosco/mems-local-serial.js";

const templates = ['footer','dashboard','actuators','adjustments','ecudata','charts','analysis','guidance'];

export async function local_initialise() {
    setRunningLocal();

    // load the templates before initialising event handlers
    await loadTemplates();

    // initialise with the local serial interface
    await initialise(new MemsLocalSerialInterface());
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

async function removeUnsupportedMemsVersions() {
    let selectElement = document.getElementById("versionButton");

    for (let i = selectElement.length - 1; i >= 0; i--){
        if (selectElement.options[i].value === '1.9') {
            selectElement.removeChild(selectElement.options[i]);
        }
    }
}
