import {ServerSocketConnection} from "../../shared/server-socket-connection";
import {SignalingMessage, SignalServerMessage} from "../shared/types";
import {bind} from "@cmmn/core";

export class SignalingConnection extends ServerSocketConnection<{
    signal: SignalServerMessage
}>{

    private decoder = new TextDecoder();

    @bind
    protected onMessage(data: string | Buffer) {
        const stringData = typeof data === "string" ? data : this.decoder.decode(data);
        const message = JSON.parse(stringData) as SignalingMessage;
        if (message.type !== 'signal')
            return;
        this.emit('signal', {
            ...message,
            from: this.userInfo
        });
    }
}