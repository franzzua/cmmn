import {yamux} from '@chainsafe/libp2p-yamux';
import {identify} from '@libp2p/identify';
import {createLibp2p} from 'libp2p';
import {multiaddr} from '@multiformats/multiaddr';
import {P2PNode} from "@cmmn/sync";
import {Cell, scoped} from "@cmmn/core";
import {gossipsub} from "@chainsafe/libp2p-gossipsub";
import {noise} from "@chainsafe/libp2p-noise";
import {webSockets} from '@libp2p/websockets'
import {bootstrap} from '@libp2p/bootstrap'
import {webRTC} from '@libp2p/webrtc'
import {pubsubPeerDiscovery} from "@libp2p/pubsub-peer-discovery";
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { dcutr } from '@libp2p/dcutr'
import {createLightNode} from "@waku/sdk";
import { floodsub } from '@libp2p/floodsub';

@scoped()
export class MainP2PNode extends P2PNode {

	constructor() {
		super();
		Cell.OnChange(() => this.peers, e =>
			console.log([...e.value].map(x => x.toString()))
		);
	}
	private server = `/dns/network.example.cmmn.local/tcp/443/tls/ws`;

	async createLibp2p() {
		const libp2p = await createLibp2p({
			transports: [
				webSockets(),
				webRTC(),
				circuitRelayTransport({

				})
			],

			connectionGater: {
				denyDialMultiaddr: () => false
			},
			addresses: {
				listen: [
					'/webrtc',
					'/p2p-circuit'
				],
			},
			connectionEncrypters: [noise()],
			streamMuxers: [yamux()],
			peerDiscovery: [
				bootstrap({
					list: [this.server]
				}),
				pubsubPeerDiscovery({
					interval: 1000,
				})
			],
			services: {
				identify: identify(),
				pubsub: floodsub({

					// allowPublishToZeroTopicPeers: true,
					// scoreThresholds: {
					// 	gossipThreshold: Number.NEGATIVE_INFINITY,
					// 	publishThreshold: Number.NEGATIVE_INFINITY,
					// 	acceptPXThreshold: Number.NEGATIVE_INFINITY,
					// 	graylistThreshold: Number.NEGATIVE_INFINITY,
					// 	opportunisticGraftThreshold: Number.NEGATIVE_INFINITY,
					// },
				}) as any,
				dcutr: dcutr()
			},
		});
		const conn = await libp2p.dial(multiaddr(this.server));
		// const conn2 = await libp2p.dial(multiaddr(this.server + `/p2p/${conn.remotePeer.toString()}`));

		return libp2p;
	}

}