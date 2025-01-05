import {describe, test,} from "node:test";
import {BroadcastTransport} from "../src/transport/broadcast.transport";
import {di, Fn} from "@cmmn/core";
import {Transport} from "../src/transport/transport";
import {expect} from "@cmmn/tools/test";
import {Team} from "../src/queue/team";
import * as console from "node:console";
import {Broker} from "../src/queue/broker";

describe('quorum', async () => {
    await test('two', async () => {
        di.override(Transport, BroadcastTransport);
        const contexts = [di.child(), di.child()];
        try {
            const quorum1 = contexts[0].resolve(Team);
            expect(quorum1.isLeader).toBeTruthy();
            const quorum2 = contexts[1].resolve(Team);
            expect(quorum2.isLeader).toBeTruthy();
            await Fn.asyncDelay(10);
            expect(!quorum2.isLeader).toBeTruthy();
            expect(quorum1.isLeader).toBeTruthy();
        } finally {
            await di[Symbol.asyncDispose]();
            await contexts[0][Symbol.asyncDispose]();
            await contexts[1][Symbol.asyncDispose]();
        }
    });
    await test('many', async () => {
        di.override(Transport, BroadcastTransport);
        const contexts = Array(10).fill(null).map(() => di.child());

        try {
            for (let i = 0; i < 100; i++) {
                const quorums = contexts.map(c => c.resolve(Team));
                await Fn.asyncDelay(10);
                for (let q of quorums.slice(1)){
                    expect(q.users).toEqual(quorums[0].users);
                }
                if (Math.random() > .2){
                    const newContext = di.child();
                    contexts.push(newContext);
                }
                if (Math.random() > .5){
                    await contexts.shift()?.[Symbol.asyncDispose]();
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