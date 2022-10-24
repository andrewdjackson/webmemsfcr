import 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
import "../thirdparty/chartjs-plugin-annotation.min.js";
import * as Identifier from "./identifiers.js";
import {charts} from "./memsecu.js";

const sparkLength = 120;
const chartLength = 120;
const skipped = (ctx, value) => ctx.p0.skip || ctx.p0.parsed.y === 0 ? value : undefined;
const faulty = (ctx, value) => ctx.p0.parsed.y > 0 ? value : undefined;

var faultsArray = {}

export function createCharts() {
    let chart = document.querySelectorAll(`.${Identifier.ecuDataChart}`);
    for (let i = 0; i < chart.length; i++) {
        const chartCtx = document.getElementById(chart[i].id);
        const chartId = `${chart[i].id}_graph`;
        const chartTitle = `${chartCtx.title}`;

        const graph = createChart(chartCtx, chartId, chartTitle);
        charts.push(graph);
    }
}

export function createSparks() {
    let chart = document.querySelectorAll(`.${Identifier.ecuDataSpark}`);
    for (let i = 0; i < chart.length; i++) {
        const chartCtx = document.getElementById(chart[i].id);
        const chartId = `${chart[i].id}_spark`;

        const graph = createSpark(chartCtx, chartId);
        charts.push(graph);
    }
}

export function updateCharts(df, faults) {
    console.debug(`start chart at ${new Date().getTime()}`);
    let time = df[Identifier.ecuDataTimeMetric80];
    if (time === undefined) {
        time = df[Identifier.ecuDataTimeMetric7d];
    }

    Object.entries(df).forEach((entry) => {
        const [id, value] = entry;
        const fault = _hasFault(id, faults);
        _updateCharts(id,time,value,fault);
    });
    console.debug(`finish chart at ${new Date().getTime()}`);
}

function _hasFault(id, faults) {
    if (faults !== undefined) {
        return faults[id];
    }

    return false;
}

function _updateCharts(id, time, value, fault) {
    const chartId = `${id}_${Identifier.ecuDataChart}`;
    const chart = findChart(chartId);
    if (chart !== undefined) {
        // update the main graph
        _addDataToChart(chart, time, value, fault);
    }

    const sparkId = `${id}_${Identifier.ecuDataSpark}`;
    const spark = findChart(sparkId);
    if (spark !== undefined) {
        // update the spark
        _addDataToChart(spark, time, value, fault);
    }
}

function _addDataToChart(chart, time, value, fault) {
    if (chart !== undefined) {
        addData(chart, time, value, fault);
    }
}

function createChart(ctx, id, title) {
    return new Chart(ctx, {
        id: id,
        type: 'line',
        data: {
            labels: Array.apply(null, Array(chartLength)).map(function() { return '' }),
            datasets: [{
                data: Array.apply(null, Array(chartLength)).map(function() { return 0 }),
                cubicInterpolationMode: 'monotone',
                tension: 0,
                borderColor: 'rgba(102,102,255,1)',
                backgroundColor: 'rgba(102,153,204,0.1)',
                fillColor: "rgba(102,153,51,0.1)",
                strokeColor: "rgba(220,220,220,1)",
                borderWidth: 1,
                fill: true,
            },
                {
                    data: Array.apply(null, Array(chartLength)).map(function() { return 0 }),
                    cubicInterpolationMode: 'monotone',
                    tension: 0,
                    borderWidth: 2,
                    segment: {
                        borderColor: ctx => skipped(ctx, 'rgba(102,102,255,0)') || faulty(ctx, 'rgba(178, 16, 28, 1.0)'),
                        backgroundColor: ctx => skipped(ctx, 'rgba(102,102,255,0)') || faulty(ctx, 'rgba(255,0,0,0.3)'),
                    },
                    fill: true,
                }],
        },
        elements: {
            point: {
                radius: 0 // default to disabled in all datasets
            }
        },
        options: {
            normalized: true,
            responsive: true,
            maintainAspectRatio: false,
            spanGaps: true,
            radius: 0,
            plugins: {
                legend: {
                    display: false,
                },
                annotation: {
                    annotations: faultsArray[id],
                },
                decimation: {
                    enabled: true,
                    algorithm: 'min-max',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: false,
                    grid: {
                        fontStyle: "normal",
                        fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
                        color: "rgba(102,153,0,0.2)"
                    },
                    title: {
                        fontSize: 14,
                        fontStyle: "normal",
                        fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
                        display: true,
                        text: title,
                    },
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        display:false
                    },
                }
            },
        }
    });
}

function createSpark(ctx, id) {
    return new Chart(ctx, {
        id: id,
        type: 'line',
        data: {
            labels: Array.apply(null, Array(sparkLength)).map(function() { return '' }),
            datasets: [{
                data: Array.apply(null, Array(sparkLength)).map(function() { return 0 }),
                borderColor: 'rgba(102,102,255,0.9)',
                //backgroundColor: 'rgba(102,153,204,0.1)',
                fillColor: "rgba(102,153,51,0.2)",
                strokeColor: "rgba(220,220,220,1)",
                borderWidth: 1,
                cubicInterpolationMode: 'monotone',
                tension: 0,
                fill: true,
            },{
                data: Array.apply(null, Array(sparkLength)).map(function() { return 0 }),
                cubicInterpolationMode: 'monotone',
                tension: 0,
                borderWidth: 1,
                segment: {
                    borderColor: ctx => skipped(ctx, 'rgba(102,102,255,0)') || faulty(ctx, 'rgba(202,12,55,1.0)'),
                    backgroundColor: ctx => skipped(ctx, 'rgba(102,102,255,0)') || faulty(ctx, 'rgba(255,0,0,0.3)'),
                },
                fill: true,
            }],
        },
        elements: {
            point: {
                radius: 0 // default to disabled in all datasets
            }
        },
        options: {
            normalized: true,
            responsive: true,
            resizeDelay: 200,
            maintainAspectRatio: false,
            spanGaps: true,
            radius: 0,
            plugins: {
                legend: {
                    display: false,
                },
            },
            tooltips: {
                enabled: false
            },
            scales: {
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        display:false
                    },
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        display:false
                    },
                }
            }
        },
    });
}

export function addData(chart, label, data, fault) {
    chart.data.labels.shift()
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(data)
    chart.data.datasets[0].data.shift()

    if (chart.data.datasets.length === 1) {
        chart.data.datasets.push(
            {data: Array.apply(null, Array(chart.data.datasets[0].data.length)).map(function() { return 0 })}
        )
    }

    shiftAnnotations(chart)

    if (fault === true) {
        // draw faulty line at same datapoint
        if (isNewFault(chart)) {
            addAnnotation(chart, chart.data.datasets[0].data.length - 1, data)
        }
        chart.data.datasets[1].data.push(data)
    } else {
        // if the previous data value in the fault line has a value then push a NaN to give a clean cutoff in the fill
        if (chart.data.datasets[1].data[chart.data.datasets[1].data.length - 1] > 0){
            chart.data.datasets[1].data.push(NaN)
        } else {
            chart.data.datasets[1].data.push(0)
        }
    }
    chart.data.datasets[1].data.shift()

    chart.update('none');
}

export function findChart(id) {
    for (let i=0; i < charts.length; i++) {
        if (charts[i].canvas.id === id) {
            return charts[i];
        }
    }

    return undefined;
}

function addAnnotation(chart, x,y) {
    var ch = chart.getContext()
    var id = ch.chart.ctx.canvas.id
    var xLabel = -50
    var yLabel = 9

    if (typeof faultsArray[id] === 'undefined') {
        return
    }

    if (y < 8) {
        yLabel = -15
    }

    faultsArray[id].push ({
        type: 'label',
        xValue: x,
        yValue: y,
        xAdjust: xLabel,
        yAdjust: yLabel,
        backgroundColor: 'rgba(173, 23, 33, 1)',
        content: ['fault'],
        textAlign: 'start',
        color: 'rgba(255,255,255,1)',
        borderRadius: 3,
        backgroundShadowColor: 'rgba(197, 197, 197, 1)',
        shadowOffsetX:4,
        shadowOffsetY:4,
        shadowBlur: 2,
        height: 12,
        font: {
            size: 11,
        },
        callout: {
            enabled: true,
            side: 5,
        }
    });
}

function shiftAnnotations(chart) {
    var ch = chart.getContext()
    var id = ch.chart.ctx.canvas.id

    if (typeof faultsArray[id] === 'undefined') {
        return
    }

    if (faultsArray[id].length > 0) {
        // move all x values by 1
        faultsArray[id].forEach((fault) => {
            fault.xValue = fault.xValue - 1
        });

        if (faultsArray[0] < 0) {
            // remove first element
            faultsArray[id].shift()
        }
    }
}

function isNewFault(chart) {
    var ch = chart.getContext()
    var id = ch.chart.ctx.canvas.id

    if (typeof faultsArray[id] === 'undefined') {
        return false
    }

    var len = faultsArray[id].length

    if (len > 0) {
        // if the last fault was triggered on the last data value then not a new fault in this continuous series
        // return false
        var lastFaultAnnotation = faultsArray[id][len - 1].xValue
        var lastFaultPosition = chart.data.datasets[0].data[chartLength - 1]

        return (lastFaultAnnotation !== chartLength - 2) && (lastFaultPosition === 0)
    } else {
        return true
    }
}


