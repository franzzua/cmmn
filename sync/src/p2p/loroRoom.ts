import type {LoroDoc} from 'loro-crdt';
import {LoroMessage, LoroMessageType} from './loro.message';
import {LoroProtocol} from "./loro.protocol";
import {Syncronizable} from "./syncronizable";
import {cell, ObservableSet} from "@cmmn/core";

export class LoroRoom extends Syncronizable<Uint8Array> implements AsyncDisposable {

	constructor(
		private protocol: LoroProtocol,
		private topic: string,
	) {
		super();
		this.protocol.join(this.topic);
	}

	@cell()
	private accessor _peers = new ObservableSet<string>();

	public get peers(): ReadonlySet<string> {
		return this._peers;
	}

	protected async *getUpdates(){
		for await (let message of this.protocol.iterate(LoroMessageType.Update)) {
			if (message.topic !== this.topic) continue;
			yield message.update;
		}
	}

	async sync(doc: LoroDoc){
		this.protocol.on(LoroMessageType.Join, async message => {
			if (message.topic !== this.topic) return;
			this._peers.add(message.from.toString());
			const compare = doc.version().compare(message.version);
			if (compare == 0) return;
			if (compare === undefined || compare < 0) {
				await this.send({
					type: LoroMessageType.Request,
					version: doc.version(),
				});
			}
			if (compare === undefined || compare > 0) {
				await this.send({
					type: LoroMessageType.Update,
					update: doc.export({
						mode: 'update',
						from: message.version,
					}),
				});
			}
		});

		this.protocol.on(LoroMessageType.Request, message => {
			if (message.topic !== this.topic) return;
			return message.reply({
				type: LoroMessageType.Update,
				update: doc.export({
					mode: 'update',
					from: message.version,
				}),
			});
		})
		const peers = await this.protocol.waitPeers(1, this.topic);
		for (let peer of peers) {
			this._peers.add(peer.toString());
		}
		await this.send({
			type: LoroMessageType.Join,
			version: doc.version(),
		});
	}


	private async send(message: LoroMessage) {
		await this.protocol.send(this.topic, message);
	}

	async [Symbol.asyncDispose]() {
		this.protocol.leave(this.topic);
	}

	async addUpdate(update: Uint8Array) {
		await this.send({
			type: LoroMessageType.Update,
			update: update,
		});
	}
}


