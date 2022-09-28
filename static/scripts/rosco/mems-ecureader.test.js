import {beforeEach, describe, expect, it} from "vitest";
import {ECUReader} from "./mems-ecureader.js";
import {EventQueue, EventTopic} from "./mems-queue.js";

let q;
let e;
let receivedData;
let sendRate = 1000;

beforeEach(() => {
    q = new EventQueue();
    q.subscribe(EventTopic.Dataframe, messageReceived);

    e = new ECUReader(q);
})

describe('pause command queue', () => {
    it('should pause sending commands', () => {
        e.paused = true;
        expect(e.isPaused).toBe(true);
    })
})

describe('send dataframe request commands at send rate', () => {
    it(`should send 2 commands at ${sendRate} ms intervals`, async () => {
        let numberOfCommands = 2;
        // calculate how long is required to send n messages with the send rate, plus a margin for processing
        let timeToSend = 2 * sendRate + 10;

        e.interval = sendRate;

        await e.Connect();
        expect(e.isConnected).toBe(true);

        // start sending dataframe commands and sending commands from the command queue
        e.Start();

        await e._sleep(timeToSend);

        // stop sending dataframe requests and sending command from the command queue
        e.Stop();

        expect(e.sent).toBe(numberOfCommands);

        await e.Disconnect();
        expect(e.isConnected).toBe(false);
    })
})

function messageReceived(data) {
    console.log(`subscriber received ${JSON.stringify(data)}`);
    receivedData = data;
}
