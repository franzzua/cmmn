import {RoomOptions} from "../../webrtc/client/room";
import {WebsocketConnection} from "./websocket-connection";
import {Room} from "./room";

export class WebsocketProvider {
    private connection = new WebsocketConnection(this.server);

    constructor(private server: string) {
    }

    public joinRoom(roomName: string, options: RoomOptions): Room {
        this.connection.send({
            type: 'register',
            room: roomName,
            token: options.token
        });
        const room = new Room(this.connection, roomName);
        return room;
    }

    public leaveRoom(roomName: string) {
    }
}

