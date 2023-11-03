import {Injectable} from "@cmmn/core";
import {WebSocket} from "ws";
import {ServerRoom} from "./server-room";
import {UserInfo} from "../../webrtc/shared/types";
import {WebSocketMessage} from "../shared/types";
import {WebsocketConnection} from "./websocket.connection";
import {TokenParser} from "../../shared";

@Injectable()
export class WebSocketController {
    private rooms = new Map<string, ServerRoom>();
    private subscribedTopics = new Set<ServerRoom>();

    constructor(private parser: TokenParser) {
    }

    public async handleConnection(socket: WebSocket) {
        socket.on('message', async (msg: Buffer) => {
            try {
                const registerMessage = await this.GetRegistrationMessage(msg);
                if (!registerMessage)
                    return;
                const userInfo: UserInfo = {
                    user: registerMessage.token.User,
                    accessMode: registerMessage.token.AccessMode
                }
                console.log(userInfo.user);
                const room = this.rooms.getOrAdd(registerMessage.room, name => new ServerRoom(name));
                const connection = new WebsocketConnection(socket, userInfo);
                room.addClient(connection);
                this.subscribedTopics.add(room);
            } catch (e) {
                return e ? (e.message ?? e) : 'unknown error';
            }
        });
    }

    private async GetRegistrationMessage(msg: Buffer): Promise<{
        room: string;
        token: { User; AccessMode: 'read' | 'write'; }
    }> {
        const messageStr = msg.toString('utf8');
        const message = JSON.parse(messageStr) as WebSocketMessage;
        if (message.type !== 'register') {
            return;
        }
        const token = await this.parser.Parse(message.token);
        if (!token) {
            throw new Error('unauthorized');
        }
        return {
            room: message.room,
            token: token
        };
    }
}