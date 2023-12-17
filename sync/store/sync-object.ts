import { ObservableObject } from "@cmmn/cell";
import {CRuntime, CValueMap} from "@collabs/collabs";
import {DeepPartial} from "@cmmn/core";

/** @internal **/
export class SyncObject<T> extends ObservableObject<T>{
    constructor(private doc: CRuntime, private map: CValueMap<keyof T, any>) {
        super(Object.fromEntries(map.entries()) as T);
    }
    private readonly subscriptions: Array<Function> = [];
    protected subscribe(eventName){
        super.subscribe(eventName);
        this.Set(Object.fromEntries(this.map.entries()) as T)
        this.subscriptions.push(
            this.map.on('Set', (event) => {
                this.Diff({
                    [event.key as keyof T]: event.value
                } as DeepPartial<T>);
            }),
            this.map.on('Delete', (event) => {
                this.Diff({
                    [event.key as keyof T]: null
                } as DeepPartial<T>);
            }),
            this.on('change', async e => {
                this.doc.transact(() => {
                    for (let key of e.keys) {
                        if (this.map.get(key as keyof T) !== e.value[key])
                            this.map.set(key as keyof T, e.value[key]);
                    }
                });
            })
        );
    }

    protected unsubscribe(eventName){
        super.unsubscribe(eventName);
        this.subscriptions.forEach(x => x());
        this.subscriptions.length = 0;
    }

}