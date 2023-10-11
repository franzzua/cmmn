import { bind } from "@cmmn/core";
import {ServerSocketConnection} from "../../shared/server-socket-connection.js";
import {WebSocketDataMessage} from "../shared/types.js";

export class WebsocketConnection extends ServerSocketConnection<{
    message: WebSocketDataMessage
}>{

    private decoder = new TextDecoder();

    @bind
    protected onMessage(data: string | Buffer) {
        const dataStr = typeof data ==="string" ? data : this.decoder.decode(data);
        this.emit("message", JSON.parse(dataStr));
    }

}