import {LoroDoc, LoroEventBatch, Subscription, VersionVector} from "loro-crdt";
import {BaseCell, EventEmitter} from "@cmmn/core";
import {filter, map, pipe} from "../pipe";

export class LoroCell<T> extends BaseCell<T> {

    constructor(data?: Uint8Array,
                public doc: LoroDoc = data ? LoroDoc.fromSnapshot(data) : new LoroDoc()) {
        super(() => doc.toJSON().value);
    }

    private docEvents = new LoroDocEventEmitter(this.doc);

    async sinkFrom(ai: AsyncIterable<Uint8Array>) {
        for await (let uint8Array of ai) {
            this.doc.import(uint8Array);
        }
    }

    private subscription: Subscription | undefined;

    active() {
        super.active();
        this.subscription?.();
        this.subscription = this.doc.subscribe(e => {
            this.isActual = false;
            this.onValueContentChanged();
        })
    }

    protected disactive() {
        super.disactive();
        this.subscription?.();
    }

    public async *getUpdates(abort?: AbortSignal){
        for await (let { event, diff } of this.docEvents.iterate('change')){
            if (event.by == 'local'){
                yield diff;
            }
        }
    }

    [Symbol.dispose](){
        super[Symbol.dispose]();
        this.docEvents[Symbol.dispose]();
    }
}

export class TextLoroCell extends LoroCell<string> {
    public text = this.doc.getText('value');

}

class LoroDocEventEmitter extends EventEmitter<{
    change: { event: LoroEventBatch, diff: Uint8Array }
}> {
    constructor(private doc: LoroDoc) {
        super();
    }

    private subscription: Subscription | undefined;
    protected subscribe(eventName: 'change') {
        super.subscribe(eventName);
        let lastVersion = this.doc.version();
        this.subscription = this.doc.subscribe(event => {
            this.emit('change', {
                event,
                diff: this.doc.export({
                    mode: 'update',
                    from: lastVersion
                })
            });
            lastVersion = this.doc.version()
        });
    }

    protected unsubscribe(eventName: 'change') {
        super.unsubscribe(eventName);
        this.subscription?.();
    }
}