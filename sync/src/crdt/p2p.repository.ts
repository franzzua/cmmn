import {inject} from '@cmmn/core';
import {P2PNode} from '../p2p/p2p.node';
import {LoroDocCell} from './cells/loro-doc-cell';
import {StorageProvider} from './storage';
import {LoroRoom} from "../p2p/loroRoom";
import {Cryptor} from "./cryptor";

export class P2PRepository implements AsyncDisposable {
	@inject(P2PNode) p2pNode!: P2PNode;
	@inject(StorageProvider) storageProvider!: StorageProvider;

	storage = this.storageProvider.getStorage<Uint8Array>(this.name);

	constructor(private name: string) {
	}

	private disposables: (AsyncDisposable | Disposable)[] = [];
	private rooms = new Map<string, LoroRoom>();


	async loadDoc(uri: string): Promise<LoroDocCell> {
		const data = await this.storage.get(uri);
		const cell = new LoroDocCell(data);
		this.syncDoc(cell, uri);
		return cell;
	}

	createDoc(uri: string) {
		const cell = new LoroDocCell();
		this.syncDoc(cell, uri);
		return cell;
	}

	private async syncDoc(cell: LoroDocCell, uri: string) {
		cell.on('snapshot', snapshot => {
			this.storage.set(uri, snapshot);
		});
		if (!this.rooms.has(uri)){
			const cryptor = await this.getCryptor(uri);
			this.rooms.set(uri, new LoroRoom(this.p2pNode.loroProtocol, uri, cryptor));
		}
		cell.room = this.rooms.get(uri);
		await cell.room.sync(cell.doc)
	}

	async [Symbol.asyncDispose]() {
		for (let disposable of this.disposables) {
			if (!disposable) return;
			if (Symbol.asyncDispose in disposable)
				await disposable[Symbol.asyncDispose]();
			else disposable[Symbol.dispose]?.();
		}
		this.disposables.length = 0;
		for (let room of this.rooms.values()) {
			await room[Symbol.asyncDispose]();
		}
		this.rooms.clear();
	}

	protected async getCryptor(uri: string): Promise<Cryptor>{
		return {
			decrypt: async x => x,
			encrypt: async x => x
		} as Cryptor
	}
}

