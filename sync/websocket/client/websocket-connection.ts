import {WebSocketDataMessage, WebSocketMessage} from "../shared/types.js";
import { bind } from "@cmmn/core";
import {ClientWebsocketConnection} from "../../shared/client-websocket-connection.js";

export class WebsocketConnection extends ClientWebsocketConnection<{
    message: WebSocketDataMessage;
    error: string;
}>{


    private decoder = new TextDecoder();
    constructor(url: string) {
        super(url);
        this.reconnect();
    }

    @bind
    protected onMessage(event){
        const dataStr = typeof event.data === "string" ? event.data : this.decoder.decode(event.data);
        const message = JSON.parse(dataStr) as WebSocketMessage;
        if (typeof message.type === "number")
            this.emit('message', message as WebSocketDataMessage);
    }

    public async send(data: WebSocketMessage) {
        await this.connected$;
        this.ws.send(JSON.stringify(data));
    }
}