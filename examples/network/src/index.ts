import {createLibp2p} from "libp2p";
import {noise} from '@chainsafe/libp2p-noise'
import {yamux} from '@chainsafe/libp2p-yamux'
import {webSockets} from '@libp2p/websockets'
import * as filter from '@libp2p/websockets/filters'
import {circuitRelayServer, circuitRelayTransport,} from '@libp2p/circuit-relay-v2'
import {identify} from "@libp2p/identify";
import {autoNAT} from "@libp2p/autonat";
import {gossipsub} from "@chainsafe/libp2p-gossipsub";
import {pubsubPeerDiscovery, TOPIC} from "@libp2p/pubsub-peer-discovery";
import * as process from "process";
import * as console from "node:console";
import { floodsub } from '@libp2p/floodsub';

process.env.PUBLIC_MULTIADDR = `/dns/network.example.cmmn.local/tcp/${process.env.PORT ?? 9090}/ws`;

export const node = await createLibp2p({
	transports: [
		webSockets({}),
		circuitRelayTransport(),
		// webRTC()
	],
	addresses: {
		listen: [
			process.env.PUBLIC_MULTIADDR,
			// '/webrtc',
			// '/ip4/0.0.0.0/udp/4005/p2p-circuit'
		],
		announce: [
			process.env.PUBLIC_MULTIADDR
		]
	},
	connectionGater: {
		denyDialMultiaddr: () => false,
		denyInboundRelayedConnection: () => false,
		denyInboundRelayReservation: () => false,
		denyOutboundRelayedConnection: () => false,
		denyDialPeer: () => false
	},
	connectionManager: {},
	connectionEncrypters: [
		noise()
	],
	streamMuxers: [
		yamux({})
	],
	peerDiscovery: [
		pubsubPeerDiscovery({
			interval: 1000
		})
	],
	services: {
		pubsub: floodsub({
			// emitSelf: true,
			// allowPublishToZeroTopicPeers: true,
			canRelayMessage: true,
			// scoreThresholds: {
			// 	gossipThreshold: Number.NEGATIVE_INFINITY,
			// 	publishThreshold: Number.NEGATIVE_INFINITY,
			// 	acceptPXThreshold: Number.NEGATIVE_INFINITY,
			// 	graylistThreshold: Number.NEGATIVE_INFINITY,
			// 	opportunisticGraftThreshold: Number.NEGATIVE_INFINITY,
			// },
			// doPX: true,
			// scoreParams: {
			// 	appSpecificScore(p: string): number {
			// 		return 100;
			// 	}
			// },
		}),
		autoNat: autoNAT(),
		identify: identify(),

		relay: circuitRelayServer({
			reservations: {
				maxReservations: Number.POSITIVE_INFINITY
			}
			//
			// reservations: {
			// 	maxReservations: 200,
			// }
		}),
	},
})
await node.start()

node.addEventListener('peer:discovery', e => {
	console.warn('+', e.detail.id.toString());
	// console.log(node.services.relay.reservations.size)
});
node.addEventListener('peer:disconnect', e => {
	console.warn('-', e.detail.toString())
	// node.services.relay.reservations.delete(e.detail);
	// console.log(node.services.relay.reservations.size)
});

console.log('multiaddrs:', node.getMultiaddrs());
console.log(`LISTEN http://127.0.0.1:${process.env.PORT}`);
