import {CRuntime} from "@collabs/collabs";

export class BroadcastSync {
    private channel = new BroadcastChannel(this.name);
    constructor(private name: string,
                private logger: typeof console.log | undefined = undefined) {
    }

    /** @internal **/
    public listen(doc: CRuntime){
        doc.on('Update', e => {
            if (e.caller == this)
                return;
            this.channel.postMessage({
                type: e.updateType === "message" ? "update" : "state",
                senderID: doc.replicaID,
                data: e.update,
                clock: doc.vectorClock()
            })
            this.logger?.('send', e.updateType === "message" ? "update" : "state",  doc.replicaID);
            this.logger?.(doc.vectorClock(), e.caller);
        })
        this.channel.postMessage({
            type: "getState",
            senderID: doc.replicaID,
            clock: doc.vectorClock(),
            data: doc.save()
        });
        this.logger?.('init bc', doc.replicaID)
        this.logger?.(doc.vectorClock());
        this.channel.addEventListener(
            'message',
            (e: MessageEvent<BroadcastSyncMessage>) => this.onMessage(doc, e.data)
        );
    }

    private onMessage(doc: CRuntime, data: BroadcastSyncMessage){
        switch (data.type){
            case "getState":
                this.channel.postMessage({
                    type: 'state',
                    targetID: data.senderID,
                    senderID: doc.replicaID,
                    clock: doc.vectorClock(),
                    data: doc.save()
                });
                data.data && doc.load(data.data, this);
                this.logger?.('get state from', data.senderID, data.clock);
                this.logger?.(doc.vectorClock());
                return;
            case "state":
                if (data.targetID && data.targetID !== doc.replicaID)
                    return;
                doc.load(data.data, this);
                this.logger?.('get state from', data.senderID, data.clock);
                this.logger?.(doc.vectorClock());
                return;
            case "update":
                if (data.targetID && data.targetID !== doc.replicaID)
                    return;
                doc.receive(data.data, this);
                this.logger?.('get update from', data.senderID, data.clock);
                this.logger?.(doc.vectorClock());
                return;
        }
    }

}

export type BroadcastSyncMessage = {
    type: 'update'|'state'|'getState';
    targetID: string | undefined;
    senderID: string;
    data: Uint8Array;
    clock: Map<string, number>
}