import {PeerDataChannel} from "../../shared/peer-data-channel";
import {WebsocketConnection} from "./websocket-connection";
import {MessageType} from "../../webrtc/shared/types";

export class DataConnection extends PeerDataChannel {
    constructor(private connection: WebsocketConnection,
                private roomName: string) {
        super("write");
        this.connection.on('message', message => {
            this.emit(message.type, message.data);
        })
    }

    public send(type: MessageType, data: Uint8Array) {
        this.connection.send({
            room: this.roomName,
            type: type,
            data
        });
    }

}