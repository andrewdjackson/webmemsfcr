// @vitest-environment jsdom

import { describe, it, expect, beforeAll } from 'vitest'
import {EventQueue, EventTopic} from "./mems-queue.js";

let q = new EventQueue();
let receivedData;
let publishedData = 'test data';

beforeAll(() => {
    q.subscribe('test', messageReceived);
})

describe('add to queue', () => {
    it('published data should be received by subscriber', () => {

        console.log(`publisher posted ${publishedData}`);
        q.publish('test', publishedData);
        expect(receivedData).toBe(publishedData);
    })
})

function messageReceived(data) {
    console.log(`subscriber received ${data}`);
    receivedData = data;
}
