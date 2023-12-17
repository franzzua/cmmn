import {IndexedDBDocStore} from "@collabs/indexeddb";
import {CRuntime} from "@collabs/collabs";

export class IndexedDbSync {
    private store = new IndexedDBDocStore({
        dbName: this.name
    });
    constructor(private name: string) {
    }

    public listen(doc: CRuntime){
        this.store.subscribe(doc, this.name);

    }
}