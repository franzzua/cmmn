import {WebSocket} from "ws";
import {EventEmitter} from "../webrtc/shared/observable";

export abstract class ServerSocketConnection<TEvents> extends EventEmitter<TEvents & {
    close: void
}> {
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

    public send(message: object) {
        this.socket.send(JSON.stringify(message),);
    }

    protected abstract onMessage(data: string | Buffer);

    public close() {
        super.dispose();
        this.socket.close();
    }
}

const pingTimeout = 30000
