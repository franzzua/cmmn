import {deserialize, EventEmitter, serialize} from "@cmmn/core";
export class DocAdapter extends EventEmitter<{
    message: Uint8Array;
    dispose: void;
}>{
    private bc: BroadcastChannel;
    constructor(public name: string) {
        super();
        this.bc = new BroadcastChannel(name);
        this.bc.addEventListener('message', e => this.emit('message', serialize(e.data)));
    }

    send(data: Uint8Array){
        this.bc.postMessage(deserialize(data));
    }
}