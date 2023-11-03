import {
    SignalClientMessage,
    SignalingRegistrationInfo,
    SignalingServerMessage,
    SignalData
} from "../shared/types";
import {bind} from "@cmmn/core";
import {ClientWebsocketConnection} from "../../shared/client-websocket-connection";

export class SignalingConnection extends ClientWebsocketConnection<{
    signal: SignalEvent;
    announce: AnnounceEvent;
    error: Event;
}> {

    constructor(url: string) {
        super(url);
        this.reconnect();
    }

    public async disconnect() {
    }

    private decoder = new TextDecoder();

    @bind
    protected onMessage(event: MessageEvent) {
        const stringData = typeof event.data === "string" ? event.data : this.decoder.decode(event.data);
        const message = JSON.parse(stringData) as SignalingServerMessage;
        switch (message.type) {
            case "signal":
                this.emit('signal', {
                    from: {
                        user: message.from.user,
                        accessMode: message.from.accessMode,
                        signaling: this
                    },
                    signal: message.signal,
                });
                break;
            case "announce":
                this.emit('announce', {
                    room: message.room,
                    users: message.users.map(x => ({
                        ...x,
                        signaling: this
                    }))
                });
                break;
        }
    };
    public async register(info: SignalingRegistrationInfo) {
        this.send({
            type: 'register',
            info
        });
    }

    public sendSignal(msg: SignalClientMessage) {
        this.send(msg);
    }

}

export type SignalEvent = {
    from: UserInfo,
    signal: SignalData
}

export type AnnounceEvent = {
    room: string;
    users: UserInfo[];
}

export type UserInfo = {
    user: string;
    accessMode: 'read' | 'write';
    signaling: SignalingConnection;
}

