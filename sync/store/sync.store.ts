import {Doc} from "yjs";
import {DocAdapter} from "../index";
import {Awareness} from "y-protocols/awareness";
import {ObservableYMap} from "./observable-y-map";
import {BaseCell, Cell, cell} from "@cmmn/cell";
import {IndexeddbPersistence} from "y-indexeddb";
import {ISyncProvider} from "../shared/provider";
import {compare} from "@cmmn/core";

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

    /**
     * @deprecated use syncWith(new LocalSyncProvider(name)) instead
     */
    public async useIndexedDB() {
        const indexeddbProvider = new IndexeddbPersistence(this.name, this.doc);
        await indexeddbProvider.whenSynced;
    }

    public async syncWith(provider: ISyncProvider) {
        provider.addAdapter(this.adapter);
    }

    public getObjectCell<T>(name: string): BaseCell<T>{
        const map = this.adapter.doc.getMap(name);
        map.observe((events, transaction) => {
            if (events.transaction.local)
                return;
            for (let [key, event] of (events.keys as Map<string, {action, oldValue}>).entries()) {
                cell.set({
                    ...cell.get(),
                    [key]: map.get(key)
                });
            }
        });
        const cell = new Cell<T>(map.toJSON() as T, {
            compare,
            onExternal: value => {
                for (let key in value) {
                    map.set(key, value[key]);
                }
            }
        });
        return cell;
    }


    public dispose(){
        this.doc.destroy();
        this.adapter.dispose();
    }
}

