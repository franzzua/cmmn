import { ObservableSet } from "@cmmn/cell";
import {CRuntime, CValueSet} from "@collabs/collabs";

export class SyncSet<T> extends ObservableSet<T> {
    constructor(private doc: CRuntime, private array: CValueSet<T>) {
        super(Array.from(array.values()));
    }

    private readonly subscriptions: Array<Function> = [];

    protected subscribe(eventName) {
        super.subscribe(eventName);
        for (let value of this.array.values()) {
            if (this.has(value)) continue;
            this.add(value);
        }
        for (let value of Array.from(this.values())) {
            if (this.array.has(value)) continue;
            this.delete(value);
        }
        this.subscriptions.push(
            this.array.on('Add', e => {
                this.add(e.value);
            }),
            this.array.on('Delete', e => {
                this.delete(e.value);
            }),
            this.on('change', async e => {
                this.doc.transact(() => {
                    for (let t of e.add ?? []) {
                        if (this.array.has(t)) continue;
                        this.array.add(t);
                    }
                    for (let t of e.delete ?? []) {
                        if (!this.array.has(t)) continue;
                        this.array.delete(t);
                    }
                });
            })
        );
    }

    protected unsubscribe(eventName) {
        super.unsubscribe(eventName);
        this.subscriptions.forEach(x => x());
        this.subscriptions.length = 0;
    }


}