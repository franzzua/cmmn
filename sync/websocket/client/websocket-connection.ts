import {WebSocketDataMessage, WebSocketMessage} from "../shared/types";
import {EventEmitter, EventListener} from "@cmmn/core";

export class WebsocketConnection extends EventEmitter<{
    message: WebSocketDataMessage
}>{
    private ws = new WebSocket(this.url);
    private listener = new EventListener<{
        open: void;
        message: MessageEvent
    }>(this.ws);
    private connected$ = this.listener.onceAsync('open');

    private decoder = new TextDecoder();
    constructor(private url: string) {
        super();
        this.listener.on('message', event => {
            const dataStr = typeof event.data === "string" ? event.data : this.decoder.decode(event.data);
            const message = JSON.parse(dataStr) as WebSocketMessage;
            if (typeof message.type === "number")
                this.emit('message', message as WebSocketDataMessage);
        })
    }

    public async send(data: WebSocketMessage) {
        await this.connected$;
        this.ws.send(JSON.stringify(data));
    }
}