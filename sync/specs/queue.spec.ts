import {describe, test, } from "node:test";
import {BroadcastTransport} from "../transport/broadcast.transport";
import {di, Fn} from "@cmmn/core";
import {Transport} from "../transport/transport";
import {QueueBroker} from "../queue/queue";
import {expect} from "@cmmn/tools/test";

describe('queue', async () => {
    await test('two', async () => {
        di.override(Transport, BroadcastTransport);
        const contexts = [di.child(), di.child()];
        const [broker1, broker2] = contexts.map(c => c.resolve(QueueBroker));
        await Fn.asyncDelay(10);

        const queue1 = broker1.getQueue('queue');
        const queue2 = broker2.getQueue('queue');
        try {
            queue1.enqueue(1);
            await Fn.asyncDelay(10);
            queue2.enqueue(2);
            await Fn.asyncDelay(10);
            expect(await queue2.dequeue()).toEqual(1);
            await Fn.asyncDelay(10);
            expect(await queue1.dequeue()).toEqual(2);
            const p = queue1.dequeueAsync();
            await Fn.asyncDelay(10);
            queue2.enqueue(3);
            expect(await p).toEqual(3);
        } finally {
            for (let context of contexts) {
                await context[Symbol.asyncDispose]()
            }
            await di[Symbol.asyncDispose]();
        }
    });
    await test('many', async () => {
        di.override(Transport, BroadcastTransport);
        const contexts = Array(10).fill(null).map(() => di.child());
        const brokers = contexts.map(c => c.resolve(QueueBroker));
        await Fn.asyncDelay(10);

        const queues = brokers.map(b => b.getQueue('queue'));

        try {
            for (let i = 0; i < 1000; i++) {
                const q = queues[Math.floor(Math.random() * queues.length)];
                if (Math.random() > .3){
                    q.enqueue(Math.random());
                } else {
                    await q.dequeue();
                }
                if (Math.random() > .5) {
                    await Fn.asyncDelay(1);
                }
            }
            await Fn.asyncDelay(10);
            for (let queue of queues.slice(1)) {
                expect(queue.queue).toEqual(queues[0].queue);
            }
        } finally {
            for (let context of contexts) {
                await context[Symbol.asyncDispose]()
            }
            await di[Symbol.asyncDispose]();
        }
    });
});