import {Doc} from "yjs";
import {DocAdapter} from "../index";
import {Awareness} from "y-protocols/awareness";
import {ObservableYMap} from "./observable-y-map";
import {cell} from "@cmmn/cell";
import {IndexeddbPersistence} from "y-indexeddb";

export class SyncStore<TEntity> {
    private doc = new Doc();
    public adapter = new DocAdapter(this.doc, new Awareness(this.doc));

    private items = this.doc.getMap<TEntity>('items');

    constructor(protected name) {
    }

    @cell
    public Items = new ObservableYMap<TEntity>(this.items);

    @cell
    public IsSynced = false;

    public useIndexedDB() {
        const indexeddbProvider = new IndexeddbPersistence(this.name, this.doc);
        indexeddbProvider.whenSynced.then(() => {
            this.Items.subscribe();
            this.IsSynced = true;
        })
    }
}

