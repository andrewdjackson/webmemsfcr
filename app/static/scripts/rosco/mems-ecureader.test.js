import {beforeEach, describe, expect, it} from "@jest/globals";
import {ECUReader, ECUResponse} from "./mems-ecureader.js";
import {EventQueue, EventTopic} from "./mems-queue.js";
import * as Command from "./mems-1x/mems-commands.js";

var q = new EventQueue();
var e = new ECUReader(q);
var receivedData = new ECUResponse(Command.MEMS_Dataframe7d, 0);

beforeEach(() => {
    q = new EventQueue();
    q.subscribe(EventTopic.Dataframe, messageReceived);

    e = new ECUReader(q);
    e.setDataframeInterval(100);
})

describe('pause command queue', () => {
    it('should pause sending commands', () => {
        e.paused = true;
        expect(e.isPaused).toBe(true);
    })
})

/*
describe('send dataframe request commands at send rate', () => {
    it(`should send 2 commands at ${e.getDataframeInterval()} ms intervals`, async () => {
        let numberOfCommands = 2;
        // calculate how long is required to send n messages with the send rate, plus a margin for processing
        let timeToSend = numberOfCommands * e.getDataframeInterval();

        await e.connect();
        expect(e.isConnected).toBe(true);

        // start sending dataframe commands and sending commands from the command queue
        let startTime = Date.now();
        e.startDataframeLoop();

        await e._sleep(timeToSend + 10);

        // stop sending dataframe requests and sending command from the command queue
        e.stopDataframeLoop();

        expect(receivedData.command.id).greaterThanOrEqual(startTime + timeToSend);

        await e.disconnect();
        expect(e.isConnected).toBe(false);
    })
})
*/

function messageReceived(message) {
    console.log(`subscriber received ${JSON.stringify(message)}`);
    receivedData = message;
}
