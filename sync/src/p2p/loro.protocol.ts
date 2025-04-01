import type {Libp2p, PeerId} from "@libp2p/interface";
import {LibP2PServices} from "./p2p.node";
import {LoroJoinMessage, LoroMessage, LoroMessageType, LoroRequestMessage, LoroUpdateMessage} from "./loro.message";
import {bind, EventEmitter, scoped} from "@cmmn/core";
import ts from "typescript";

@scoped()
export class LoroProtocol extends EventEmitter<{
	[LoroMessageType.Update]: LoroUpdateMessage & LoroProtocolMessage;
	[LoroMessageType.Join]: LoroJoinMessage & LoroProtocolMessage;
	[LoroMessageType.Request]: LoroRequestMessage & LoroProtocolMessage;
}> implements AsyncDisposable {

	topics = new Set([this.p2p.peerId.toString()]);

	constructor(
		private p2p: Libp2p<LibP2PServices>,
	) {
		super();
		this.p2p.services.pubsub.addEventListener('message', this.topicListener);
		this.p2p.services.pubsub.subscribe(this.p2p.peerId.toString());
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

	public send(topic: string, message: LoroMessage) {
		// console.log('send', LoroMessageType[message.type], topic);
		return this.p2p.services.pubsub.publish(topic, LoroMessage.serialize(message))
	}


	async [Symbol.asyncDispose]() {
		this.p2p.services.pubsub.removeEventListener('message', this.topicListener);
	}

	join(topic: string) {
		this.topics.add(topic)
		this.p2p.services.pubsub.subscribe(topic);
	}

	leave(topic: string) {
		this.topics.delete(topic);
		this.p2p.services.pubsub.unsubscribe(topic);
	}

	getPeers(topic: string) {
		return this.p2p.services.pubsub.getSubscribers(topic);
	}
}

type LoroProtocolMessage = {
	from: PeerId;
	topic: string;
	reply(message: LoroMessage): Promise<void>;
}