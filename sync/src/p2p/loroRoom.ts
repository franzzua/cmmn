import {LoroDoc, Subscription, VersionVector} from 'loro-crdt';
import {LoroMessage, LoroMessageType} from './loro.message';
import {LoroProtocol} from "./loro.protocol";
import {cell, Fn, inject, ObservableSet} from "@cmmn/core";
import {Cryptor} from "../crdt/cryptor";

export class LoroRoom implements AsyncDisposable {

	private abort = new AbortController();
	private unsubscr: Subscription;
	constructor(
		private protocol: LoroProtocol,
		private topic: string,
		private cryptor: Cryptor
	) {
		this.protocol.join(this.topic);
	}

	@cell()
	private accessor _peers = new ObservableSet<string>();

	public get peers(): ReadonlySet<string> {
		return this._peers;
	}

	async sync(doc: LoroDoc) {
		this.protocol.on(LoroMessageType.Update, async message => {
			if (message.topic !== this.topic) return;
			const decrypted = await this.cryptor.decrypt(message.update);
			if (!decrypted) return;
			doc.import(decrypted)
		}, this.abort)
		this.protocol.on(LoroMessageType.Join, async message => {
			if (message.topic !== this.topic) return;
			this._peers.add(message.from.toString());
			const decrypted = await this.cryptor.decrypt(message.version);
			if (!decrypted) return;
			const version = VersionVector.decode(decrypted);
			const compare = doc.version().compare(version);
			if (compare == 0) return;
			if (compare === undefined || compare < 0) {
				await this.send({
					type: LoroMessageType.Request,
					version: await this.cryptor.encrypt(doc.version().encode()),
				});
			}
			if (compare === undefined || compare > 0) {
				const update = doc.export({
					mode: 'update',
					from: version,
				});
				await this.send({
					type: LoroMessageType.Update,
					update: await this.cryptor.encrypt(update),
				});
			}
		}, this.abort);

		this.protocol.on(LoroMessageType.Request, async message => {
			if (message.topic !== this.topic) return;
			const decrypted = await this.cryptor.decrypt(message.version);
			if (!decrypted) return;
			const version = VersionVector.decode(decrypted);
			return message.reply({
				type: LoroMessageType.Update,
				update: await this.cryptor.encrypt(doc.export({
					mode: 'update',
					from: version,
				})),
			});
		}, this.abort)
		const peers = await this.waitPeers(1, this.topic);
		if (this.abort.signal.aborted) return;
		for (let peer of peers) {
			this._peers.add(peer.toString());
		}
		this.unsubscr = doc.subscribe(async event => this.send({
			type: LoroMessageType.Update,
			update: await this.cryptor.encrypt(doc.export({mode: "update"})),
		}));
		await this.send({
			type: LoroMessageType.Join,
			version: await  this.cryptor.encrypt(doc.version().encode()),
		});
	}

	private async send(message: LoroMessage) {
		await this.protocol.send(this.topic, message);
	}

	async [Symbol.asyncDispose](){
		this.abort.abort();
		await this.peersAwaiter;
		this.unsubscr?.();
		this.protocol.leave(this.topic);
	}

	peersAwaiter: Promise<void> | undefined;
	async waitPeers(count: number, topic: string) {
		while (!this.abort.signal.aborted) {
			const peers = await this.protocol.getPeers(topic);
			if (peers.length >= count)
				return peers;
			// return [];
			// TODO: change to events
			await (this.peersAwaiter = Fn.asyncDelay(1000));
			this.peersAwaiter = undefined;
		}
	}
}


