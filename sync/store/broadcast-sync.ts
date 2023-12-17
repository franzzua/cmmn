import {CRuntime} from "@collabs/collabs";

export class BroadcastSync {
    private channel = new BroadcastChannel(this.name);
    constructor(private name: string) {
    }

    /** @internal **/
    public listen(doc: CRuntime){
        doc.on('Update', e => {
            this.channel.postMessage({
                type: e.updateType === "message" ? "update" : "state",
                senderID: doc.replicaID,
                data: e.update
            })
        })
        this.channel.addEventListener('message', (e: MessageEvent<BroadcastSyncMessage>) => {
            switch (e.data.type){
                case "getState":
                    this.channel.postMessage({
                        type: 'state',
                        targetID: e.data.senderID,
                        senderID: doc.replicaID,
                        data: doc.save()
                    });
                    break;
                case "state":
                    if (e.data.targetID && e.data.targetID !== doc.replicaID)
                        break;
                    doc.load(e.data.data);
                    break;
                case "update":
                    if (e.data.targetID && e.data.targetID !== doc.replicaID)
                        break;
                    doc.receive(e.data.data);
                    break;
            }
        })
    }
}

export type BroadcastSyncMessage = {
    type: 'update'|'state'|'getState';
    targetID: string | undefined;
    senderID: string;
    data: Uint8Array;
}