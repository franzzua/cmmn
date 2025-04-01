import {inject} from '@cmmn/core';
import {P2PNode} from '../p2p/p2p.node';
import {LoroDocCell} from './cells/loro-doc-cell';
import {StorageProvider} from './storage';
import {LoroShape, LoroShaped} from "./types";
import {LoroDoc} from "loro-crdt";

export class P2PRepository implements AsyncDisposable {
	@inject(P2PNode) p2pNode!: P2PNode;
	@inject(StorageProvider) storageProvider!: StorageProvider;

	storage = this.storageProvider.getStorage<Uint8Array>(this.name);

	constructor(private name: string) {
	}

	private disposables: (AsyncDisposable | Disposable)[] = [];

	async getDoc<Shape extends LoroShape>(uri: string, shape: Shape): Promise<LoroShaped<Shape>> {
		const data = await this.storage.get(uri);
		const cell = new LoroDocCell(data);
		this.syncDoc(cell.doc, uri).then(() => {
			cell.isSynced = true;
			console.log(cell.isSynced)
		});
		return cell.getShaped<Shape>(shape);
	}

	async createDoc(uri: string) {
		const cell = new LoroDocCell();
		this.syncDoc(cell.doc, uri).then(() => cell.isSynced = true);
		return cell;
	}

	private async syncDoc(doc: LoroDoc, uri: string) {
		doc.subscribe((e) => {
			this.storage.set(uri, doc.export({mode: 'snapshot'}));
		});
		const room = await this.p2pNode.join(uri, doc);
		this.disposables.push(room);
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
