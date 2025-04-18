import {cell, Fn, getOrAdd, ObservableSet} from '@cmmn/core';
import type { Libp2p, PeerId, PubSub } from '@libp2p/interface';
import type { LoroDoc } from 'loro-crdt';
import { LoroRoom } from './loroRoom';
import {LoroProtocol} from "./loro.protocol";

export abstract class P2PNode implements AsyncDisposable {
	protected p2p: Libp2p<LibP2PServices>;
	private readonly init = this.initP2P();
	loroProtocol: LoroProtocol = new LoroProtocol(this.init)
	abstract createLibp2p(): Promise<Libp2p>;
	private accessor _peers = new ObservableSet<PeerId>();

	@cell()
	public get peers(): Set<PeerId> {
		return this._peers;
	}

	private async initP2P() {
		this.p2p = await this.createLibp2p() as Libp2p<LibP2PServices>;
		this.p2p.start();
		for (let peer of this.p2p.getPeers()) {
			if (peer.equals(this.p2p.peerId)) return;
			this._peers.add(peer);
		}
		this.p2p.addEventListener('peer:discovery', (e) => {
			this.p2p.dial(e.detail.id);
			return this._peers.add(e.detail.id);
		});
		// this.p2p.addEventListener('peer:', (e) => this._peers.add(e.detail.id));
		// this.p2p.addEventListener('peer:connect', (e) => this._peers.add(e.detail));
		// this.p2p.addEventListener('peer:disconnect', (e) =>
		// 	this._peers.delete(e.detail),
		// );
		await Fn.asyncDelay(1000);

// Wait for connection and relay to be bind for the example purpose
		this.p2p.addEventListener('self:peer:update', (evt) => {
			// Updated self multiaddrs?
			// console.log(`Advertising with a relay address of ${this.p2p.getMultiaddrs()}`)
		});
		return this.p2p;
	}

	async getPeers() {
		await this.init;
		return this.p2p.getPeers();
	}

	async [Symbol.asyncDispose]() {
		await this.init;
		await this.p2p.stop();
	}
}

export type LibP2PServices = {
	pubsub: PubSub;
};
