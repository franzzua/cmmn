import {P2PNode} from "../src/p2p/p2p.node";
import {Multiaddr} from "@multiformats/multiaddr";
import {memory} from "@libp2p/memory";
import {plaintext} from "@libp2p/plaintext";
import {yamux} from "@chainsafe/libp2p-yamux";
import {bootstrap} from "@libp2p/bootstrap";
import {identify} from "@libp2p/identify";
import {floodsub} from "@libp2p/floodsub";
import { createLibp2p } from "libp2p";
import {Libp2p} from "@libp2p/interface";
import {singleton} from "@cmmn/core";

@singleton()
export class InMemoryP2PNode extends P2PNode {
    static addresses = [] as Multiaddr[];
    static counter = 0;
    static instances: Libp2p[] = [];

    async createLibp2p() {
        const p2p = await createLibp2p({
            transports: [
                memory()
            ],
            addresses: {
                listen: [`/memory/address-${InMemoryP2PNode.counter++}`]
            },
            connectionEncrypters: [
                plaintext()
            ],
            streamMuxers: [yamux()],
            peerDiscovery: InMemoryP2PNode.addresses.length ? [
                bootstrap({
                    list: InMemoryP2PNode.addresses.map(x => x.toString())
                }),
            ] : [],
            services: {
                identify: identify(),
                pubsub: floodsub()
            }
        });
        InMemoryP2PNode.addresses.push(...p2p.getMultiaddrs());
        for (let instance of InMemoryP2PNode.instances) {
            await p2p.dial(instance.getMultiaddrs());
        }
        InMemoryP2PNode.instances.push(p2p);

        return p2p;
    }

    static async connect(nodes: InMemoryP2PNode[]) {
        for (let i = 0; i < nodes.length; i++) {
            await nodes[i].init;
            for (let j = 0; j < i; j++) {
                // await nodes[j].p2p.dial(nodes[i].p2p.getMultiaddrs()[0])
            }
        }
    }

}