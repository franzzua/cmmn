import { bind } from "@cmmn/core";
import {WebSocketConnection} from "../../shared/web-socket-connection";
import {WebSocketDataMessage} from "../shared/types";

export class WebsocketConnection extends WebSocketConnection<{
    message: WebSocketDataMessage
}>{

    private decoder = new TextDecoder();

    @bind
    protected onMessage(data: string | Buffer) {
        const dataStr = typeof data ==="string" ? data : this.decoder.decode(data);
        this.emit("message", JSON.parse(dataStr));
    }

}