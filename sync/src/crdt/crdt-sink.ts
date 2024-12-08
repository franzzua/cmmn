import {LoroDoc, Subscription, VersionVector} from "loro-crdt";
import {BaseCell} from "@cmmn/core";
import {filter, map, pairwise, pipe} from "../pipe";

export class LoroCell<T> extends BaseCell<T> {

    constructor(data?: Uint8Array,
                public doc: LoroDoc = data ? LoroDoc.fromSnapshot(data) : new LoroDoc()) {
        super(() => doc.toJSON().value);
    }

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
        let prevVersion: VersionVector = this.doc.version();
        for await (let change of this.iterate('change', abort)){
            const version = this.doc.version();
            if (version.get(this.doc.peerId) !== prevVersion.get(this.doc.peerId)){
                yield this.doc.export({
                    mode: 'update',
                    from: prevVersion
                })
            }
            prevVersion = version;
        }
    }
}

export class TextLoroCell extends LoroCell<string> {
    public text = this.doc.getText('value');

}