import {beforeAll, describe, expect, it} from "vitest";
import {ECUReader} from "./mems-ecureader.js";
import {EventQueue} from "./mems-queue";

let q;
let e;
let receivedData;
let publishedData = 'test data';
let sendRate = 1000;

beforeAll(() => {
    q = new EventQueue();
    q.subscribe('test', messageReceived);

    e = new ECUReader(q);
})

describe('send rate', () => {
    it('should send commands at a controlled rate', async () => {
        e.interval = sendRate;
        expect(e.interval).toBe(sendRate);

        e.Connect();
        expect(e.isConnected).toBe(true);
        expect(e.isPaused).toBe(false);

        let startTime = Date.now();
        await e.GetDataframes();
        expect(Date.now()).greaterThanOrEqual(startTime + sendRate);
    })
})

describe('pause command queue', () => {
    it('should pause sending commands', () => {
        e.paused = true;
        expect(e.isPaused).toBe(true);
    })
})

function messageReceived(data) {
    console.log(`subscriber received ${data}`);
    receivedData = data;
}
