import * as Faults from "../analysis/analysis-faults.js";
import * as Identifier from "./identifiers.js";
import * as Chart from "./charts.js";

export class AnalysisReport {
    constructor(analysis) {
        this.analysis = analysis;
    }

    updateReport() {
        this._displayNoFaults();

        if (this.analysis.hasData) {
            if (this.analysis.faults.length > 0) {
                console.warn(`faults found ${JSON.stringify(this.analysis.faults)}`);
                this._displayFaults();
            }
        }
    }

    updateFaultPill() {
        if (this.analysis.hasData) {
            if (this.analysis.faults.length > 0) {
                const alerts = this.analysis.faults.filter(fault => fault.level !== "info");
                if (alerts.length > 0) {
                    let elements = document.querySelectorAll(`.fault-count`);
                    this._updateElementsInnerHTML(elements, alerts.length);
                    this._displayElement("fault-count");
                }
            }
        }
    }

    _displayFaults() {
        this._hideElement("analysis-no_faults");
        this._displayElement("analysis-has_faults");

        this._displayAtOperatingTemperature();

        this.analysis.faults.forEach((fault) => {
            const faultId = `analysis-${fault.id}`;
            this._displayElement(faultId);
            this._loadFaultPage(fault);
        });
    }
    _displayNoFaults() {
        this._displayAtOperatingTemperature();

        this._displayElement("analysis-no_faults");
        this._hideElement("analysis-has_faults");
    }

    _displayAtOperatingTemperature() {
        if (this._hasFault(Faults.AtOperatingTemp.id)) {
            this._hideElement("analysis-engine_cold");
        } else {
            this._displayElement("analysis-engine_cold");
        }
    }

    _hasFault(id) {
        this.analysis.faults.find(obj => {
            return obj.id === id;
        })

        return false;
    }

    _displayElement(metric) {
        let elements = document.querySelectorAll(`.${metric}`);
        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];
            if (element !== undefined) {
                element.classList.remove('d-none');
            }
        }
    }

    _hideElement(metric) {
        let elements = document.querySelectorAll(`.${metric}`);
        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];
            if (element !== undefined) {
                element.classList.add('d-none');
            }
        }
    }

    _loadFaultPage(fault) {
        const faultId = `analysis-${fault.id}`;
        const id = faultId.replaceAll("_","-");
        const endpoint = `/static/templates/faults/${id}.html`;

        this._sendRequest('GET', endpoint)
            .then(response => this._loadFaultPageResponse(fault, response));
    }

    async _loadFaultPageResponse(fault, response) {
          const id = `analysis-${fault.id}`;

        let elements = document.querySelectorAll(`.${id}.analysis-title`);
        await this._updateElementsInnerHTML(elements, fault.title);

        elements = document.querySelectorAll(`.${id}.analysis-content`);
        await this._updateElementsInnerHTML(elements, response);

        await this._updateAnalysisCharts();
    }

    async _updateElementsInnerHTML(elements, html) {
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
    async _updateAnalysisCharts() {
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

    async _sendRequest(method, endpoint, body) {
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
}
