import {bind} from "@cmmn/core";
import {WebsocketConnection} from "./websocket.connection";
import {WebSocketDataMessage, WebSocketMessage} from "../shared/types";

export class ServerRoom {
    private users = new Map<string, WebsocketConnection>();

    constructor(private name: string) {

    }


    public addClient(connection: WebsocketConnection) {
        console.log(connection.userInfo);
        this.users.forEach(c => c.send({
            type: "announce",
            room: this.name,
            users: [connection.userInfo]
        }));
        connection.send({
            type: "announce",
            room: this.name,
            users: Array.from(this.users.values()).map(x => x.userInfo)
        });
        if (this.users.has(connection.userInfo.user))
            this.users.get(connection.userInfo.user).close();
        this.users.set(connection.userInfo.user, connection);
        connection.on('message', this.onMessage);
        connection.on('close', () => this.users.delete(connection.userInfo.user))
    }

    @bind
    private onMessage(message: WebSocketDataMessage) {
        for (let user of this.users.values()) {
            user.send(message);
        }
    }
}

