import {ISyncProvider} from "../shared";
import {IndexeddbPersistence} from "y-indexeddb";
import {DocAdapter} from "../shared";

export class LocalSyncProvider implements ISyncProvider{

    constructor(private name: string) {
    }

    async addAdapter(docAdapter: DocAdapter) {
        const indexeddbProvider = new IndexeddbPersistence(this.name, docAdapter.doc);
        await indexeddbProvider.whenSynced;
    }

}