import {LoroDoc, VersionVector} from 'loro-crdt';
import {LoroMessage, LoroMessageType} from './loro.message';
import {LoroProtocol} from "./loro.protocol";
import {cell, ObservableSet} from "@cmmn/core";

import {Cryptor} from "../crdt/cryptor";

import {KeyStore} from "../crdt/keyStore";

export class LoroRoom implements AsyncDisposable {

	private keyStore = new KeyStore();

	constructor(
		private protocol: LoroProtocol,
		private topic: string,
		private cryptor: Cryptor<Uint8Array>
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
			const decrypted = await this.keyStore.decrypt(message.update);
			if (!decrypted) return;
			doc.import(decrypted)
		})
		this.protocol.on(LoroMessageType.Join, async message => {
			if (message.topic !== this.topic) return;
			this._peers.add(message.from.toString());
			const decrypted = await this.keyStore.decrypt(message.version);
			if (!decrypted) return;
			await this.keyStore.add(message.from.toString(), message.publicKey);
			const version = VersionVector.decode(decrypted);
			const compare = doc.version().compare(version);
			if (compare == 0) return;
			if (compare === undefined || compare < 0) {
				await this.send({
					type: LoroMessageType.Request,
					version: await this.keyStore.encrypt(doc.version().encode()),
					publicKey: await this.keyStore.getPublicKey()
				});
			}
			if (compare === undefined || compare > 0) {
				await this.send({
					type: LoroMessageType.Update,
					update: await this.keyStore.encrypt(doc.export({
						mode: 'update',
						from: version,
					})),
					publicKey: await this.keyStore.getPublicKey()
				});
			}
		});

		this.protocol.on(LoroMessageType.Request, async message => {
			if (message.topic !== this.topic) return;
			const decrypted = await this.keyStore.decrypt(message.version);
			if (!decrypted) return;
			const version = VersionVector.decode(decrypted);
			return message.reply({
				type: LoroMessageType.Update,
				update: await this.keyStore.encrypt(doc.export({
					mode: 'update',
					from: version,
				})),
				publicKey: await this.keyStore.getPublicKey()
			});
		})
		const peers = await this.protocol.waitPeers(1, this.topic);
		for (let peer of peers) {
			this._peers.add(peer.toString());
		}
		doc.subscribe(async event => this.send({
			type: LoroMessageType.Update,
			update: await this.keyStore.encrypt(doc.export({mode: "update"})),
			publicKey: await this.keyStore.getPublicKey()
		}));
		await this.send({
			type: LoroMessageType.Join,
			version: await  this.keyStore.encrypt(doc.version().encode()),
			publicKey: await this.keyStore.getPublicKey()
		});
	}

	private async send(message: LoroMessage) {
		await this.protocol.send(this.topic, message);
	}

	async [Symbol.asyncDispose]() {
		this.protocol.leave(this.topic);
	}
}


