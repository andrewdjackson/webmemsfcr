import {analysis} from "./memsecu.js";
import * as Faults from "../analysis/analysis-faults.js";
import * as Identifier from "./identifiers.js";
import * as Chart from "./charts.js";

export function updateFaultReport() {
    _displayNoFaults();

    if (analysis.hasData) {
        if (analysis.faults.length > 0) {
            console.warn(`faults found ${JSON.stringify(analysis.faults)}`);
            _displayFaults();
        }
    }
}

export function updateFaultPill() {
    if (analysis.hasData) {
        if (analysis.faults.length > 0) {
            let elements = document.querySelectorAll(`.fault-count`);
            _updateElementsInnerHTML(elements, analysis.faults.length);
            _displayElement("fault-count");
        }
    }
}

function _displayFaults() {
    _hideElement("analysis-no_faults");
    _displayElement("analysis-has_faults");

    _displayAtOperatingTemperature();

    analysis.faults.forEach((fault) => {
        const faultId = `analysis-${fault.id}`;
       _displayElement(faultId);
       _loadFaultPage(fault);
    });
}
function _displayNoFaults() {
    _displayAtOperatingTemperature();

    _displayElement("analysis-no_faults");
    _hideElement("analysis-has_faults");
}

function _displayAtOperatingTemperature() {
    if (_hasFault(Faults.AtOperatingTemp.id)) {
        _hideElement("analysis-engine_cold");
    } else {
        _displayElement("analysis-engine_cold");
    }
}

function _hasFault(id) {
    analysis.faults.find(obj => {
        return obj.id === id;
    })

    return false;
}

function _displayElement(metric) {
    let elements = document.querySelectorAll(`.${metric}`);
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        if (element !== undefined) {
            element.classList.remove('d-none');
        }
    }
}

function _hideElement(metric) {
    let elements = document.querySelectorAll(`.${metric}`);
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        if (element !== undefined) {
            element.classList.add('d-none');
        }
    }
}

function _loadFaultPage(fault) {
    const faultId = `analysis-${fault.id}`;
    const id = faultId.replaceAll("_","-");
    const endpoint = `/static/templates/faults/${id}.html`;

    SendRequest('GET', endpoint)
        .then(response => _loadFaultPageResponse(fault, response));
}

async function _loadFaultPageResponse(fault, response) {
    //document.getElementById("analysis").innerHTML = response;
    const id = `analysis-${fault.id}`;

    let elements = document.querySelectorAll(`.${id}.analysis-title`);
    await _updateElementsInnerHTML(elements, fault.title);

    elements = document.querySelectorAll(`.${id}.analysis-content`);
    await _updateElementsInnerHTML(elements, response);

    await _updateAnalysisCharts();
}

async function _updateElementsInnerHTML(elements, html) {
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        if (element !== undefined) {
            element.innerHTML = html;
        }
    }
}

//
// iterate the charts in the analysis report and update the chart images
// from the dynamic charts
//
async function _updateAnalysisCharts() {
    let images = document.querySelectorAll(`.${Identifier.analysisClass}`);
    for (let i = 0; i < images.length; i++) {
        let classes = images[i].className.split(' ');
        let id = classes[1];
        let chartId = `${Identifier.ecuDataChart} ${id}`;

        const chart = Chart.findChart(chartId);
        if (chart !== undefined) {
            let image = await Chart.getChartAsImage(id);
            if (image !== undefined) {
                images[i].src = image;
            }
        }
    }
}

async function SendRequest(method, endpoint, body) {
    let init = {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }

    const response = await fetch(endpoint, init);

    if (!response.ok) {
        let message = `${endpoint} failed with status ${response.status}`;
        console.error(message);
    }

    return await response.text();
}
