import {WebSocket} from "ws";
import {SignalingMessage, SignalingServerMessage, SignalServerMessage} from "../shared/types";
import {EventEmitter} from "../shared/observable";
import {bind} from "@cmmn/core";

export class ClientConnection extends EventEmitter<{
    signal: SignalServerMessage,
    close: void
}>{
    constructor(private socket: WebSocket,
                public userInfo: {
                    user: string, accessMode: 'read' | 'write'
                }) {
        super();
        this.listenPingPong();
        this.socket.on('message', this.onMessage);
        this.socket.on('close', () => this.emit('close'));
    }

    private listenPingPong() {
        let pongReceived = true;
        const pingInterval = setInterval(() => {
            if (!pongReceived) {
                this.socket.close()
                clearInterval(pingInterval)
            } else {
                pongReceived = false
                try {
                    this.socket.ping()
                } catch (e) {
                    this.socket.close()
                }
            }
        }, pingTimeout)
        this.socket.on('pong', () => {
            pongReceived = true
        })
    }

    public send(message: SignalingServerMessage) {
        // const buffer = new Buffer(JSON.stringify(message), 'utf8');
        this.socket.send(JSON.stringify(message),);
    }

    private decoder = new TextDecoder();

    @bind
    private onMessage(data: string | Buffer) {
        const stringData = typeof data === "string" ? data : this.decoder.decode(data);
        const message = JSON.parse(stringData) as SignalingMessage;
        if (message.type !== 'signal')
            return;
        this.emit('signal', {
            ...message,
            from: this.userInfo
        });
    }

    public close() {
        super.dispose();
        this.socket.close();
    }
}

const pingTimeout = 30000
