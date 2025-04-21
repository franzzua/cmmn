import type {Libp2p, PeerId} from "@libp2p/interface";
import {LibP2PServices} from "./p2p.node";
import {LoroJoinMessage, LoroMessage, LoroMessageType, LoroRequestMessage, LoroUpdateMessage} from "./loro.message";
import {bind, EventEmitter, Fn, getOrAdd, scoped} from "@cmmn/core";

@scoped()
export class LoroProtocol extends EventEmitter<{
	[LoroMessageType.Update]: LoroUpdateMessage & LoroProtocolMessage;
	[LoroMessageType.Join]: LoroJoinMessage & LoroProtocolMessage;
	[LoroMessageType.Request]: LoroRequestMessage & LoroProtocolMessage;
}> implements AsyncDisposable {

	topics = new Set();

	constructor(
		private p2p: Promise<Libp2p<LibP2PServices>>,
	) {
		super();
		this.p2p.then(p2p => {
			p2p.services.pubsub.addEventListener('message', this.topicListener);
			p2p.services.pubsub.subscribe(p2p.peerId.toString());
			this.topics.add(p2p.peerId.toString());
		})
	}

	@bind()
	async topicListener(e: Event & { detail: { data: Uint8Array; from?: PeerId; topic?: string } }) {
		if (!this.topics.has(e.detail.topic))
			return;
		const from = e.detail.from;
		const message = LoroMessage.deserialize(e.detail.data);
		if (!message) {
			// console.log(`Unknown message from `, e.detail.topic ?? from, e.detail.data);
			return;
		}
		const messageWithReply = Object.assign(message, {
			reply: (message: LoroMessage) => this.sendTo(
				from, message
			),
			from,
			topic: e.detail.topic
		}) as LoroMessage & LoroProtocolMessage
		// console.log('receive', LoroMessageType[message.type], from, e.detail.topic);
		switch (messageWithReply.type) {
			case LoroMessageType.Update:
				this.emit(LoroMessageType.Update, messageWithReply);
				break;
			case LoroMessageType.Join:
				this.emit(LoroMessageType.Join, messageWithReply);
				break;
			case LoroMessageType.Request: {
				this.emit(LoroMessageType.Request, messageWithReply);
				break;
			}
		}
	}

	public sendTo(peerId: PeerId, message: LoroMessage) {
		return this.send(peerId.toString(), message);
	}

	public async send(topic: string, message: LoroMessage) {
		const p2p = await this.p2p;
		return p2p.services.pubsub.publish(topic, LoroMessage.serialize(message))
	}


	async [Symbol.asyncDispose]() {
		const p2p = await this.p2p;
		p2p.services.pubsub.removeEventListener('message', this.topicListener);
	}

	async join(topic: string) {
		const p2p = await this.p2p;
		this.topics.add(topic)
		p2p.services.pubsub.subscribe(topic);
	}

	async leave(topic: string) {
		const p2p = await this.p2p;
		this.topics.delete(topic);
		p2p.services.pubsub.unsubscribe(topic);
	}

	async getPeers(topic: string) {
		const p2p = await this.p2p;
		return p2p.services.pubsub.getSubscribers(topic);
	}



	async waitPeers(count: number, topic: string) {
		while (true) {
			const peers = await this.getPeers(topic);
			if (peers.length >= count)
				return peers;
			// return [];
			// TODO: change to events
			await Fn.asyncDelay(1000);
		}
	}


	get peerId(){
		return this.p2p.then(x => x.peerId);
	}
}

type LoroProtocolMessage = {
	from: PeerId;
	topic: string;
	reply(message: LoroMessage): Promise<void>;
}