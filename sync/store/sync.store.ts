import {cell, ObservableList, ObservableObject, ObservableSet} from "@cmmn/cell";
import {DeepPartial, Fn} from "@cmmn/core";
import {CRuntime, CValueMap, CObject, CValueList, CValueSet, CMap, CLazyMap} from "@collabs/collabs";
import {IndexedDBDocStore} from "@collabs/indexeddb";
import {TabSyncNetwork} from "@collabs/tab-sync";

export class SyncStore {
    // private doc = new Doc({
    //     autoLoad: true
    // });
    // public adapter = new DocAdapter(this.doc, new Awareness(this.doc));
    private doc  = new CRuntime();
    private objects = this.doc.registerCollab("objects",
            init => new CLazyMap(init, init => new CValueMap(init))
    );
    private arrays = this.doc.registerCollab("lists",
        init => new CLazyMap(init, init => new CValueList(init))
    );
    private sets = this.doc.registerCollab("sets",
        init => new CLazyMap(init, init => new CValueSet(init))
    );
    private store = new IndexedDBDocStore({
        dbName: this.name
    });
    private tabSync = new TabSyncNetwork({
        bcName: this.name,
        allUpdates: true
    });

    public IsLoaded = new Promise(resolve => this.store.on('Load', resolve));
    constructor(protected name) {
        this.addProvider();
    }

    @cell
    public IsSynced = false;
    public addProvider(){
        this.store.subscribe(this.doc, this.name);
        this.tabSync.subscribe(this.doc, this.name);
    }
    public getObjectCell<T>(name: string): ObservableObject<T>{
        const map = this.objects.get(name);
        const cell = new ObservableObject<T>({} as T);
        this.IsLoaded.then(() => {
            cell.Set(Object.fromEntries(map.entries()) as T);
            map.on('Set', (event) => {
                cell.Diff({
                    [event.key as keyof T]: event.value
                } as DeepPartial<T>);
            });
            map.on('Delete', (event) => {
                cell.Diff({
                    [event.key as keyof T]: null
                } as DeepPartial<T>);
            });
            cell.on('change', async e => {
                this.doc.transact(() => {
                    for (let key of e.keys) {
                        if (map.get(key as keyof T) !== e.value[key])
                            map.set(key as keyof T, e.value[key]);
                    }
                });
            });
        });
        return cell;
    }

    public getArray<T>(name: string): ObservableList<T>{
        const array = this.arrays.get(name) as CValueList<T>;
        const arr = new ObservableList<T>();
        this.IsLoaded.then(() => {
            arr.push(...array.values());
            array.on('Insert', (events) => {
                arr.splice(events.index, 0, ...events.values);
            });
            array.on('Delete', (events) => {
                arr.splice(events.index, events.values.length);
            });
            arr.on('splice', async e => {
                array.splice(e.index, e.deleteCount, ...e.values);
            });
            arr.on('push', async e => {
                array.push(...e.values);
            });
        });
        return arr;
    }
    public getSet<T>(name: string): ObservableSet<T>{
        const array = this.sets.get(name) as CValueSet<T>;
        const arr = new ObservableSet<T>([]);
        this.IsLoaded.then(() => {
            for (let value of array.values()) {
                arr.add(value);
            }
            array.on('Add',e => {
                arr.add(e.value);
                console.log(this.name, 'add', e.value);
            });
            array.on('Delete',e => {
                arr.delete(e.value);
                console.log(this.name, 'remove', e.value);
            });
            arr.on('change', async e => {
                this.doc.transact(() => {
                    for (let t of e.add ?? []) {
                        if (array.has(t)) continue;
                        array.add(t);
                    }
                    for (let t of e.delete ?? []) {
                        if (!array.has(t)) continue;
                        array.delete(t);
                    }
                });
            })
        })
        return arr;
    }


    public dispose(){
    }
}

