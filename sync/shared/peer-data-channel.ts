import {EventEmitter} from "../webrtc/shared/observable";
import {MessageType} from "../webrtc/shared/types";

export abstract class PeerDataChannel extends EventEmitter<{
    [key in MessageType]: Uint8Array;
} & {
    close: void;
}> {
    private decoder = new TextDecoder();
    private encoder = new TextEncoder();

    constructor(public accessMode: "read" | "write") {
        super();
    }

    public abstract send(type: MessageType, data: Uint8Array);

    public emit(type: MessageType | "close", data: Uint8Array | void) {
        if (this.accessMode == "read" && type == MessageType.Update) {
            console.warn(`User with read access should not update document`);
            return;
        }
        super.emit(type, data);
    }

    public disconnect(){
        super.dispose();
    }
}

export type PeerDataChannelMessage = {}