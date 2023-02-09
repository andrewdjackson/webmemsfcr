import {analysis} from "./memsecu.js";

export function updateFaultReport() {
    console.warn(`faults found ${JSON.stringify(analysis.faults)}`);
}
