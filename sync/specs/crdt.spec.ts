import {Fn} from "@cmmn/core";
import {TextLoroCell} from "../src/crdt/crdt-sink";
import {describe, test, mock} from "node:test";
import {expect} from "@cmmn/tools/test";
import {P2PNode} from "../src/p2p/p2p.node";
import {createLibp2p} from "libp2p";
import {floodsub} from "@libp2p/floodsub";
import {Multiaddr} from '@multiformats/multiaddr'
import {identify} from '@libp2p/identify'
import {memory} from '@libp2p/memory'
import {plaintext} from '@libp2p/plaintext'
import {bootstrap} from '@libp2p/bootstrap'
import { yamux } from '@chainsafe/libp2p-yamux'

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
        const nodes = [new MockLibP2PNode(), new MockLibP2PNode()];
        const cells = [new TextLoroCell(), new TextLoroCell()];
        cells[1].text.insert(0, 'H');
        cells[1].doc.commit();
        await MockLibP2PNode.connect(nodes);
        const syncs = [] as AsyncDisposable[];
        for (let i = 0; i < 2; i++) {
            syncs.push(await cells[i].syncP2P(nodes[i], 'ch'));
        }
        try {
            await Fn.asyncDelay(10);
            expect(cells[0].get()).toEqual('H');

            cells[0].text.insert(1, 'e');
            cells[0].doc.commit();
            await Fn.asyncDelay(10);
            expect(cells[1].get()).toEqual('He');
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

class MockLibP2PNode extends P2PNode {
    static addresses = [] as Multiaddr[];
    static counter = 0;

    async createLibp2p() {
        const p2p = await createLibp2p({
            transports: [
                memory()
            ],
            addresses: {
                listen: [`/memory/address-${MockLibP2PNode.counter++}`]
            },
            connectionEncrypters: [
                plaintext()
            ],
            streamMuxers: [ yamux() ],
            peerDiscovery: MockLibP2PNode.addresses.length ? [
                bootstrap({
                    list: MockLibP2PNode.addresses.map(x => x.toString())
                }),
            ] : [],
            services: {
                identify: identify(),
                pubsub: floodsub()
            }
        });
        MockLibP2PNode.addresses.push(...p2p.getMultiaddrs());
        return p2p;
    }

    static async connect(nodes: MockLibP2PNode[]) {
        for (let i = 0; i < nodes.length; i++) {
            await nodes[i].init;
            for (let j = 0; j < i; j++) {
                await nodes[j].p2p.dial(nodes[i].p2p.getMultiaddrs()[0])
            }
        }
    }

}