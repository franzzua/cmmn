import {resolve} from '@cmmn/core';
import {P2PNode} from './p2p.node';
import {P2PLoroProtocol} from "./p2PLoroProtocol";
import {Repository} from "../crdt/repository";

export class P2PRepository extends Repository {
	private readonly p2pNode = resolve(P2PNode);

	private readonly protocol: Promise<P2PLoroProtocol> | undefined = this.p2pNode.init.then(p2p =>
		new P2PLoroProtocol(p2p.peerId.toString(), p2p.services.pubsub as any)
	);

	constructor(name: string) {
		super(name);
		this.addProtocol(this.protocol);
	}
}

