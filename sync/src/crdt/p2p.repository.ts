import {inject, singleton} from "@cmmn/core";
import {P2PNode} from "../p2p/p2p.node";
import {LoroCell} from "./loro-cell";
import {StorageProvider} from "./storage";

export class P2PRepository implements AsyncDisposable {
    @inject(P2PNode) p2pNode!: P2PNode;
    @inject(StorageProvider) storageProvider!: StorageProvider;

    storage = this.storageProvider.getStorage<Uint8Array>(this.name);

    constructor(private name: string) {

    }

    private disposables: (AsyncDisposable | Disposable)[] = [];

    async getDoc(uri: string) {
        const data = await this.storage.get(uri);
        const cell = new LoroCell(data);
        await this.syncCell(cell, uri);
        return cell;
    }

    async createDoc(uri: string) {
        const cell = new LoroCell();
        await this.syncCell(cell, uri);
        return cell;
    }

    private async syncCell(cell: LoroCell<any>, uri: string) {
        cell.on('change', e => {
            this.storage.set(uri, cell.doc.export({mode: 'snapshot'}));
        });
        const room = await cell.syncP2P(this.p2pNode, uri);
        this.disposables.push(room);
        this.disposables.push(cell);
    }

    async [Symbol.asyncDispose]() {
        for (let disposable of this.disposables) {
            if (Symbol.asyncDispose in disposable)
                await disposable[Symbol.asyncDispose]();
            else
                disposable[Symbol.dispose]();
        }
    }
}

