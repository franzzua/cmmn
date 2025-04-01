import type {LoroDoc} from 'loro-crdt';
import {Fn} from '@cmmn/core';
import {LoroMessage, LoroMessageType} from './loro.message';
import {LoroProtocol} from "./loro.protocol";

export class LoroRoom implements AsyncDisposable {

	origin = Symbol(this.constructor.name);

	constructor(
		private protocol: LoroProtocol,
		private topic: string,
		private doc: LoroDoc,
	) {
		this.protocol.join(this.topic);
	}
	async init(){
		this.protocol.on(LoroMessageType.Update, message => {
			if (message.topic !== this.topic) return;
			this.doc.import(message.update);
		});

		this.protocol.on(LoroMessageType.Join, async message => {
			if (message.topic !== this.topic) return;
			const compare = this.doc.version().compare(message.version);
			if (compare == 0) return;
			if (compare === undefined || compare < 0) {
				await this.send({
					type: LoroMessageType.Request,
					version: this.doc.version(),
				});
			}
			if (compare === undefined || compare > 0) {
				await this.send({
					type: LoroMessageType.Update,
					update: this.doc.export({
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
				update: this.doc.export({
					mode: 'update',
					from: message.version,
				}),
			});
		})
		await this.sendVersion();
	}


	printPeers(){
		const peers = this.protocol.getPeers(this.topic);
		console.log(this.topic, peers.map(x => x.toString()));
	}


	private version = this.doc.version();
	private docUnsubscribe = this.doc.subscribe(async (e) => {
		if (e.by == "import") return;
		const update = this.doc.export({
			mode: 'update',
			from: this.version,
		});
		this.version = this.doc.version();
		await this.send({
			type: LoroMessageType.Update,
			update: update,
		});
	});

	private async sendVersion() {
		await Fn.asyncDelay(5);
		await this.send({
			type: LoroMessageType.Join,
			version: this.doc.version(),
		});
	}

	private async send(message: LoroMessage) {
		await this.protocol.send(this.topic, message);
	}

	async [Symbol.asyncDispose]() {
		this.protocol.leave(this.topic);
		this.docUnsubscribe();
	}

	async waitPeers(count: number) {
		while (true) {
			const peers = this.protocol.getPeers(this.topic);
			if (peers.length >= count)
				break;
			console.warn(`Waiting ${count} peers in topic '${this.topic}'`);
			await Fn.asyncDelay(1000);
		}
		await this.init();
	}
}
