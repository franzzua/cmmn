import {PeerDataChannel} from "../../shared/peer-data-channel";
import {MessageType} from "../../webrtc/shared/types";

export class ChannelMock extends PeerDataChannel {
    private static instances = new Set<ChannelMock>();

    constructor() {
        super('write');
        ChannelMock.instances.add(this);
    }


    public send(type: MessageType, data: Uint8Array) {
        for (let channel of ChannelMock.instances) {
            if (channel === this)
                continue;
            channel.emit(type, data);
        }
    }


}
