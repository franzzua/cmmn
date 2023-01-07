import {ISyncProvider} from "../shared/provider";
import {IndexeddbPersistence} from "y-indexeddb";
import {DocAdapter} from "../shared/doc-adapter";

export class LocalSyncProvider implements ISyncProvider{

    constructor(private name: string) {
    }

    async addAdapter(docAdapter: DocAdapter) {
        const indexeddbProvider = new IndexeddbPersistence(this.name, docAdapter.doc);
        await indexeddbProvider.whenSynced;
    }

}