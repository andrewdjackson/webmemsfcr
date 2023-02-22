//
// Local Initialisation is called by index.html which is served by the go webserver
// this is used to set up differences in the environments before the commmon
// initialisation is executed
//

import {initialise} from "./init.js";

const templates = ['footer','dashboard','actuators','adjustments','ecudata','charts','analysis','guidance'];

export async function local_initialise() {
    // load the templates before initialising event handlers
    await loadTemplates();

    initialise();
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
