import {LoroDoc, Subscription, VersionVector} from 'loro-crdt/nodejs';
import {LoroMessageType} from './loro.message';
import {cell, Fn, ObservableSet} from "@cmmn/core";
import {Cryptor} from "./cryptor";
import {LoroProtocol} from "./loroProtocol";

export class LoroRoom {


	constructor(
		private topic: string,
		private cryptor: Cryptor
	) {
	}

	@cell()
	private accessor _peers = new ObservableSet<string>();

	public get peers(): ReadonlySet<string> {
		return this._peers;
	}

	async sync(doc: LoroDoc, protocol: LoroProtocol): Promise<AsyncDisposable> {
		const abort = new AbortController();
		protocol.join(this.topic);
		protocol.on(LoroMessageType.Update, async message => {
			if (message.topic !== this.topic) return;
			const decrypted = await this.cryptor.decrypt(message.update);
			if (!decrypted) return;
			doc.import(decrypted)
		}, abort)
		protocol.on(LoroMessageType.Join, async message => {
			if (message.topic !== this.topic) return;
			this._peers.add(message.from.toString());
			const decrypted = await this.cryptor.decrypt(message.version);
			if (!decrypted) return;
			const version = VersionVector.decode(decrypted);
			const compare = doc.version().compare(version);
			if (compare == 0) return;
			if (compare === undefined || compare < 0) {
				await protocol.send(this.topic, {
					type: LoroMessageType.Request,
					version: await this.cryptor.encrypt(doc.version().encode()),
				});
			}
			if (compare === undefined || compare > 0) {
				const update = doc.export({
					mode: 'update',
					from: version,
				});
				await protocol.send(this.topic, {
					type: LoroMessageType.Update,
					update: await this.cryptor.encrypt(update),
				});
			}
		}, abort);

		protocol.on(LoroMessageType.Request, async message => {
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
		}, abort)
		// const peers = await this.waitPeers(protocol, 1, this.topic);
		if (abort.signal.aborted) return {
			async [Symbol.asyncDispose]() {
			}
		}
		// for (let peer of peers) {
		// 	this._peers.add(peer.toString());
		// }
		const subscribe = doc.subscribe(async event => protocol.send(this.topic, {
			type: LoroMessageType.Update,
			update: await this.cryptor.encrypt(doc.export({mode: "update"})),
		}));
		await protocol.send(this.topic, {
			type: LoroMessageType.Join,
			version: await this.cryptor.encrypt(doc.version().encode()),
		});
		return {
			[Symbol.asyncDispose]: async () => {
				subscribe();
				abort.abort();
				protocol.leave(this.topic);
			}
		}
	}
}


