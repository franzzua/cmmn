import {Fn} from "@cmmn/core";
import {TextLoroCell} from "../src/crdt/crdt-sink";
import {describe, test, mock} from "node:test";
import {expect} from "@cmmn/tools/test";
import {InMemoryP2PNode} from "./inMemoryP2PNode";

describe('crdt', () => {

    test('text', async function text() {
        const source = new TextLoroCell();
        source.text.insert(0, 'Hello');
        source.text.insert(5, ' world!');
        source.doc.commit();
        expect(source.get()).toEqual('Hello world!');
        const onChange = mock.fn();
        source.text.delete(11, 1);
        source.on('change', onChange);
        source.doc.commit();
        await Fn.asyncDelay(0);
        expect(onChange.mock.callCount()).toEqual(1);
        expect(source.get()).toEqual('Hello world')
    });


    test('sync', async function sync() {
        const source = new TextLoroCell();
        const target = new TextLoroCell();

        const promise1 = target.sinkFrom(source.getUpdates());

        source.text.insert(0, 'Hello');
        source.text.insert(5, ' world!');
        source.doc.commit();
        await Fn.asyncDelay(0);
        expect(target.get()).toEqual('Hello world!');
        source.text.delete(11, 1);
        source.doc.commit();
        await Fn.asyncDelay(0);
        expect(target.get()).toEqual('Hello world');
        source[Symbol.dispose]();
        // await Fn.asyncDelay(0);
        await promise1;
    })

    test('p2p', async function p2p() {
        const nodes = [new InMemoryP2PNode(), new InMemoryP2PNode()];
        const cells = [new TextLoroCell(), new TextLoroCell()];
        cells[0].text.insert(0, 'H');
        cells[0].doc.commit();
        await InMemoryP2PNode.connect(nodes);
        const syncs = [] as AsyncDisposable[];
        for (let i = 0; i < 2; i++) {
            syncs.push(await cells[i].syncP2P(nodes[i], 'ch'));
        }
        try {
            await Fn.asyncDelay(10);
            expect(cells[1].get()).toEqual('H');

            cells[1].text.insert(1, 'e');
            cells[1].doc.commit();
            await Fn.asyncDelay(10);
            expect(cells[0].get()).toEqual('He');
        } finally {
            for (let sync of syncs) {
                await sync[Symbol.asyncDispose]();
            }
            for (let node of nodes) {
                await node[Symbol.asyncDispose]();
            }
        }

    })
});