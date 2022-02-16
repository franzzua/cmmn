import {
    AnnounceMessage, SignalClientMessage,
    SignalingMessage,
    SignalingRegistrationInfo,
    SignalingServerMessage,
    SignalServerMessage,
    SignalData
} from "../shared/types";
import {bind} from "@cmmn/core";
import {EventEmitter} from "../shared/observable";

export class SignalingConnection extends EventEmitter<{
    signal: SignalEvent,
    announce: AnnounceEvent
}> {


    private connected$ = new Promise(resolve => this.socket.onopen = resolve);


    constructor(private socket: WebSocket) {
        super();
        this.socket.onmessage = this.onMessage;
        this.socket.onclose = console.log;
        this.socket.onerror = console.log;
    }

    public async connect() {
        return await this.connected$;
    }

    public async disconnect() {
    }

    private encoder = new TextEncoder();

    private send(data: SignalingMessage) {
        if (this.socket.readyState == WebSocket.CLOSED ||
            this.socket.readyState == WebSocket.CLOSING) {
            console.log('closing or closed state')
            return;
        }
        // const buffer = this.encoder.encode(JSON.stringify(data));
        this.socket.send(JSON.stringify(data));
    }

    private decoder = new TextDecoder();

    @bind
    private onMessage(event: MessageEvent) {
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
        await this.connected$;
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

