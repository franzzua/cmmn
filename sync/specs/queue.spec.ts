import {describe, test, } from "node:test";
import {BroadcastTransport} from "../src/transport/broadcast.transport";
import {di, Fn} from "@cmmn/core";
import {Transport} from "../src/transport/transport";
import {expect} from "@cmmn/tools/test";
import {Team} from "../src/queue/team";
import {Broker} from "../src/queue/broker";

describe('queue', async () => {
    await test('two', async () => {
        di.override(Transport, BroadcastTransport);
        const contexts = [di.child(), di.child()];
        const broker1 = contexts[0].resolve(Broker);
        const broker2 = contexts[1].resolve(Broker);
        await Fn.asyncDelay(10);
        try {
            const queue1 = await broker1.getQueue('queue');
            await queue1.pushAsync(3);
            const queue2 = await broker2.getQueue('queue');
            await Fn.asyncDelay(10);
            expect(queue2.queue).toEqual([3]);
            await queue2.shiftAsync();
            expect(queue1.queue).toEqual([]);
            await Promise.all([
                queue1.pushAsync(1),
                queue2.pushAsync(2)
            ]);
            expect(await queue2.shiftAsync()).toEqual(1);
            expect(await queue1.shiftAsync()).toEqual(2);
            const p = queue1.onceAsync('push');
            await queue2.pushAsync(3);
            expect(await p).toEqual(3);
            expect(await queue1.shiftAsync()).toEqual(3);
        } finally {
            for (let context of contexts) {
                await context[Symbol.asyncDispose]()
            }
            await di[Symbol.asyncDispose]();
        }
    });
    await test('many', async () => {
        di.override(Transport, BroadcastTransport);
        const contexts = Array(20).fill(null).map(() => di.child());
        const brokers = contexts.map(c => c.resolve(Broker));

        await Fn.asyncDelay(10);

        const getQueues = () =>
            Promise.all(brokers.map(b => b.getQueue('queue')));

        try {
            for (let i = 0; i < 20; i++) {
                const queues = await getQueues();
                for (let queue of queues.slice(1)) {
                    expect(queue.queue).toEqual(queues[0].queue);
                }
                const q = queues[Math.floor(Math.random() * queues.length)];
                if (Math.random() > .3){
                    await q.pushAsync(Math.random());
                } else {
                    await q.shiftAsync();
                }
                await Fn.asyncDelay(5);
                if (Math.random() < .5){
                    await contexts.pop()[Symbol.asyncDispose]();
                    brokers.pop();
                } else {
                    const newContext = di.child();
                    contexts.push(newContext);
                    brokers.push(newContext.resolve(Broker))
                    await Fn.asyncDelay(10);
                }
            }
        } finally {
            for (let context of contexts) {
                await context[Symbol.asyncDispose]()
            }
            await di[Symbol.asyncDispose]();
        }
    });
});