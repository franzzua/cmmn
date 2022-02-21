import {UserInfo} from "./signaling-connection";
import {PeerDataChannel} from "../../shared/peer-data-channel";
import { MessageType } from "../shared/types";

export class PeerConnection extends PeerDataChannel {

    public constructor(private dataChannel: RTCDataChannel, private user: UserInfo) {
        super(user.accessMode);
        console.log('connected', user.user, user.accessMode, dataChannel.label);
        let type: MessageType = null;
        this.dataChannel.addEventListener('close', () => this.emit('close'));
        this.dataChannel.addEventListener('message', event => {
            const data: Uint8Array = new Uint8Array(event.data);
            if (type == null)
                type = data[0];
            else {
                this.emit(type, new Uint8Array(data));
                type = null;
            }
        });
    }

    private open$ = this.dataChannel.readyState == "open"
        ? Promise.resolve()
        : new Promise(resolve => this.dataChannel.onopen = resolve);

    public async send(type: MessageType, data: Uint8Array) {
        await this.open$;
        this.dataChannel.send(Uint8Array.of(type));
        this.dataChannel.send(data);
    }

    public disconnect() {
        this.dataChannel.close();
        super.disconnect();
    }
}

