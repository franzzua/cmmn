import {inject} from '@cmmn/core';
import {P2PNode} from '../p2p/p2p.node';
import {LoroDocCell} from './cells/loro-doc-cell';
import {StorageProvider} from './storage';
import {LoroShape, LoroShaped} from "./cells/types";

export class P2PRepository implements AsyncDisposable {
	@inject(P2PNode) p2pNode!: P2PNode;
	@inject(StorageProvider) storageProvider!: StorageProvider;

	storage = this.storageProvider.getStorage<Uint8Array>(this.name);

	constructor(private name: string) {
	}

	private disposables: (AsyncDisposable | Disposable)[] = [];

	getRoom(uri: string){
		return this.p2pNode.loroProtocol.getRoomOrCreate(uri);
	}

	async getDoc(uri: string): Promise<LoroDocCell> {
		const data = await this.storage.get(uri);
		const cell = new LoroDocCell(data);
		this.syncDoc(cell, uri);
		return cell;
	}

	async shape<Shape extends LoroShape>(uri: string, shape: Shape): Promise<LoroShaped<Shape>> {
		const doc = await this.getDoc(uri);
		return doc.getShaped<Shape>(shape);
	}

	createDoc(uri: string) {
		const cell = new LoroDocCell();
		this.syncDoc(cell, uri);
		return cell;
	}

	private async syncDoc(cell: LoroDocCell, uri: string) {
		this.storage.getSink(uri).sink(cell.iterate('snapshot'));
		const room = this.p2pNode.loroProtocol.getRoomOrCreate(uri);
		await room.sync(cell.doc)
		cell.isSynced = true;

		room.sink(cell.iterate('update'))
		cell.sink(room.updates);
	}

	async [Symbol.asyncDispose]() {
		for (let disposable of this.disposables) {
			if (!disposable) return;
			if (Symbol.asyncDispose in disposable)
				await disposable[Symbol.asyncDispose]();
			else disposable[Symbol.dispose]?.();
		}
	}
}