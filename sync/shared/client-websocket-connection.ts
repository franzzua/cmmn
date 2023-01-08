import {bind, EventEmitter, EventListener, Fn} from "@cmmn/core";

type Events = {
    error: Error;
    connected: void;
    disconnected: void;
    connecting: void;
};
type OneOf<T,U> = {
    [key in keyof T | keyof U]: key extends keyof T
        ? T[key]
        : key extends keyof U ? U[key] : never;
}
export abstract class ClientWebsocketConnection<TEvents> extends EventEmitter<OneOf<Events, TEvents>>{
    protected ws!: WebSocket;
    private listener!: EventListener<WebSocketEventMap>;
    public connected$: Promise<Event>;
    private reconnectCount = 0;

    protected constructor(protected url: string) {
        super();
    }

    @bind
    reconnect() {
        this.reconnectCount++;
        try {
            this.emit('connecting');
            this.ws = new WebSocket(this.url);
            this.listener = new EventListener(this.ws);
            this.listener.on('message', this.onMessage);
            // this.listener.on('error', e => this.emit('error', new Error(`Unknown error`)));
            this.listener.once('close', e => {
                const reason = getWebSocketCloseReason(e);
                this.emit('disconnected');
                this.emit('error', new Error(reason));
                this.listener.dispose();
                Fn.asyncDelay(100 * Math.min(this.reconnectCount**2, 600)).then(this.reconnect);
            });
            this.connected$ = this.listener.onceAsync('open');
            this.connected$.then(() => this.emit('connected'));
        }catch (e){
            this.emit('error', new Error(e.message));
            Fn.asyncDelay(100 *Math.min(this.reconnectCount**2, 600)).then(this.reconnect);
        }
    }

    protected abstract onMessage(event: MessageEvent);

    protected send(data: any) {
        if (this.ws.readyState == WebSocket.CLOSED ||
            this.ws.readyState == WebSocket.CLOSING) {
            this.emit('error', new Error('closing or closed state'))
            return;
        }
        // const buffer = this.encoder.encode(JSON.stringify(data));
        this.ws.send(JSON.stringify(data));
    }
}

function getWebSocketCloseReason(e: CloseEvent){
    switch (e.code){
        case 1000:
            return "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
        case 1001:
            return "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
        case 1002:
            return "An endpoint is terminating the connection due to a protocol error";
        case 1003:
            return "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
        case 1004:
            return "Reserved. The specific meaning might be defined in the future.";
        case 1005:
            return "No status code was actually present.";
        case 1006:
            return "The connection was closed abnormally, e.g., without sending or receiving a Close control frame";
        case 1007:
            return "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [https://www.rfc-editor.org/rfc/rfc3629] data within a text message).";
        case 1008:
            return "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.";
        case 1009:
            return "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
        case 1010: // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
            return "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + e.reason;
        case 1011:
            return "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.";
        case 1015:
            return "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
        default:
            return "Unknown reason";
    }
}