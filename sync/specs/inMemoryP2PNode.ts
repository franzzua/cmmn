import { P2PNode } from '../src/p2p/p2p.node';
import { Multiaddr } from '@multiformats/multiaddr';
import { memory } from '@libp2p/memory';
import { plaintext } from '@libp2p/plaintext';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { identify } from '@libp2p/identify';
import { floodsub } from '@libp2p/floodsub';
import { createLibp2p } from 'libp2p';
import { Libp2p } from '@libp2p/interface';
import { scoped } from '@cmmn/core';
import {circuitRelayServer, circuitRelayTransport,} from '@libp2p/circuit-relay-v2'
import {pubsubPeerDiscovery} from "@libp2p/pubsub-peer-discovery";

@scoped()
export class InMemoryP2PNode extends P2PNode {
	static addresses = [] as Multiaddr[];
	static counter = 0;
	static instances: Libp2p[] = [];
	static root = new InMemoryP2PNode(true);

	constructor(private isRoot = false) {
		super();
		console.log(isRoot)
	}
	async createLibp2p() {
		const p2p = await createLibp2p<any>({
			transports: [
				memory(),
				circuitRelayTransport(),
			],
			addresses: {
				listen: [`/memory/address-${InMemoryP2PNode.counter++}`],
			},
			connectionEncrypters: [plaintext()],
			streamMuxers: [yamux()],
			peerDiscovery: [
				pubsubPeerDiscovery({
					interval: 100
				})
			],
			services: {
				identify: identify(),
				pubsub: floodsub(),
				...(this.isRoot ? {
					relay: circuitRelayServer()
				} : {})
			},
		});
		if (!this.isRoot){
			const conn = await p2p.dial(InMemoryP2PNode.root.p2p.getMultiaddrs());
			console.log(conn.remotePeer.toString())
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
