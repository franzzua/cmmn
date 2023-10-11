import {UserInfo} from "./signaling-connection.js";
import {PeerDataChannel} from "../../shared/peer-data-channel.js";
import { MessageType } from "../shared/types.js";

export class PeerConnection extends PeerDataChannel {

    public constructor(private dataChannel: RTCDataChannel, public user: UserInfo, public incoming: boolean) {
        super(user.accessMode);
        // console.log('connected', user.user, user.accessMode, dataChannel.label);
        let type: MessageType = null;
        this.dataChannel.addEventListener('close', () => this.dispose());
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
    //
    // public disconnect() {
    //     super.disconnect();
    // }

    private isDisposing = false;
    public dispose(){
        if (this.isDisposing)
            return;
        this.isDisposing = true;
        this.dataChannel.close();
        this.emit('close');
        super.dispose();
    }
}

