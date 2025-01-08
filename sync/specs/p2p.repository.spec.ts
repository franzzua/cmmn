import {after, afterEach, beforeEach, describe, mock, test} from "node:test";
import {InMemoryP2PNode} from "./inMemoryP2PNode";
import { expect } from "@cmmn/tools/test";
import {P2PNode} from "../src/p2p/p2p.node";
import {Cell, Container, di, Fn} from "@cmmn/core";
import {P2PRepository} from "../src";
import {Storage, StorageProvider} from "../src/crdt/storage";
import {InMemoryStorage} from "./inMemoryStorage";
import * as console from "node:console";

describe('p2p-repo', () => {

    let contexts: Container[] = [];
    let repos: P2PRepository[] = [];
    di.override(P2PNode, InMemoryP2PNode);
    di.const(StorageProvider, InMemoryStorage.Provider);
    beforeEach(() => {
        contexts = [
            di.child(),
            di.child(),
            di.child(),
        ]
        repos = contexts.map(c => c.resolve(P2PRepository, 'values'));
    })
    afterEach(async () => {
        for (let repo of repos) {
            await repo[Symbol.asyncDispose]();
        }
        for (let context of contexts) {
            await context[Symbol.asyncDispose]();
        }
    });
    after(async () => {
        await di[Symbol.asyncDispose]();
    })

    test('peers', async () => {

        const doc1 = await repos[0].createDoc('1');
        const doc2 = await repos[1].createDoc('1');
        const t1 = doc1.doc.getText('value');
        const t2 = doc2.doc.getText('value');
        t1.insert(0, 'A');
        doc1.doc.commit();
        await Fn.asyncDelay(10);
        expect(t2.toString()).toBe('A');
        const doc3 = await repos[2].createDoc('1');
        await Fn.asyncDelay(10);
        expect(doc3.doc.toJSON()).toEqual({value: 'A'});
    });

});

