import {Doc} from "yjs";
import {DocAdapter} from "../webrtc/client/doc-adapter";
import {Awareness} from "y-protocols/awareness";
import {ObservableYMap} from "./observable-y-map";

export class SyncStore<TEntity> {
    private doc = new Doc();
    public adapter = new DocAdapter(this.doc, new Awareness(this.doc));

    private items = this.doc.getMap<TEntity>('items');

    constructor() {
    }

    public Items = new ObservableYMap<TEntity>(this.items);

}

