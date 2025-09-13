import {LoroDocCell} from './cells/loro-doc-cell';
import {Storage, StorageProvider} from './storage';
import {LoroRoom} from "./loroRoom";
import {Cryptor} from "./cryptor";
import {LoroProtocol} from "./loroProtocol";
import {resolve} from "@cmmn/core";

export class Repository implements AsyncDisposable {
	private readonly storageProvider = resolve(StorageProvider);
	private readonly storage: Storage<Uint8Array> = this.storageProvider.getStorage(this.name)

	private protocols = new Set<Promise<LoroProtocol>|LoroProtocol>();
	private disposables: (AsyncDisposable | Disposable)[] = [];
	private rooms = new Map<string, LoroRoom>();

	constructor(private name: string) {
	}
	async addProtocol(protocol: Promise<LoroProtocol> | LoroProtocol){
		this.protocols.add(protocol);
		this.disposables.push(await protocol);
	}

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
			const cryptor = this.getCryptor(uri);
			this.rooms.set(uri, new LoroRoom(uri, cryptor));
		}
		const protools = await Promise.all([...this.protocols.values()]);
		await cell.sync(this.rooms.get(uri), ...protools);

	}

	async [Symbol.asyncDispose]() {
		for (let disposable of this.disposables) {
			if (!disposable) return;
			if (Symbol.asyncDispose in disposable)
				await disposable[Symbol.asyncDispose]();
			else disposable[Symbol.dispose]?.();
		}
		this.disposables.length = 0;
		this.rooms.clear();
	}

	protected getCryptor(uri: string): Cryptor{
		return {
			decrypt: async x => x,
			encrypt: async x => x
		}
	}
}

