import {cell, ObservableList, ObservableObject, ObservableSet} from "@cmmn/cell";
import {CLazyMap, CRuntime, CValueList, CValueMap, CValueSet} from "@collabs/collabs";
import {IndexedDBDocStore} from "@collabs/indexeddb";
import {BroadcastSync} from "./broadcast-sync";
import {SyncObject} from "./sync-object";
import {SyncSet} from "./syncSet";
import {SyncArray} from "./syncArray";

export class SyncStore {
    // private doc = new Doc({
    //     autoLoad: true
    // });
    // public adapter = new DocAdapter(this.doc, new Awareness(this.doc));
    private doc  = new CRuntime({
        debugReplicaID: this.replicaId
    });
    protected objects = this.doc.registerCollab("objects",
        init => new CLazyMap(init, init => new CValueMap(init))
    );
    protected arrays = this.doc.registerCollab("lists",
        init => new CLazyMap(init, init => new CValueList(init))
    );
    protected sets = this.doc.registerCollab("sets",
        init => new CLazyMap(init, init => new CValueSet(init))
    );
    private store = new IndexedDBDocStore({
        dbName: this.name
    });

    public IsLoaded = new Promise(resolve => this.store.on('Load', resolve));
    constructor(protected name, private replicaId: string = undefined) {
        this.addProvider();
    }

    @cell
    public IsSynced = false;
    public addProvider(){
        this.store.subscribe(this.doc, this.name);
    }
    public addSync(sync: BroadcastSync){
        sync.listen(this.doc);
    }
    public getObjectCell<T>(name: string): ObservableObject<T>{
        const map = this.objects.get(name);
        return new SyncObject(this.doc, map as CValueMap<keyof T, any>);
    }
    public getArray<T>(name: string): ObservableList<T>{
        const array = this.arrays.get(name) as CValueList<T>;
        return new SyncArray(this.doc, array);
    }
    public getSet<T>(name: string): ObservableSet<T>{
        const array = this.sets.get(name) as CValueSet<T>;
        return new SyncSet(this.doc, array);
    }


    public dispose(){
        this.sets.finalize();
        this.objects.finalize();
        this.arrays.finalize();
        this.store.unsubscribe(this.doc)
    }
}

