import { ObservableList } from "@cmmn/cell";
import {CRuntime, CValueList} from "@collabs/collabs";

export class SyncArray<T> extends ObservableList<T> {
    constructor(private doc: CRuntime, private array: CValueList<T>) {
        super(Array.from(array.values()));
    }

    private readonly subscriptions: Array<Function> = [];

    protected subscribe(eventName) {
        super.subscribe(eventName);
        this.splice(0, this.length, ...this.array.values());
        this.subscriptions.push(
            this.array.on('Insert', (events) => {
                this.splice(events.index, 0, ...events.values);
            }),
            this.array.on('Delete', (events) => {
                this.splice(events.index, events.values.length);
            }),
            this.on('splice', async e => {
                this.array.splice(e.index, e.deleteCount, ...e.values);
            }),
            this.on('push', async e => {
                this.array.push(...e.values);
            })
        );
    }

    protected unsubscribe(eventName) {
        super.unsubscribe(eventName);
        this.subscriptions.forEach(x => x());
        this.subscriptions.length = 0;
    }


}