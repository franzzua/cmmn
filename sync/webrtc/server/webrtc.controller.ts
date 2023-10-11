import {Injectable} from "@cmmn/core";
import {WebSocket} from "ws";
import {SignalingMessage, UserInfo} from "../shared/types.js";
import {ServerRoom} from "./server-room.js";
import {TokenParser} from "../../shared/index.js";
import {SignalingConnection} from "./signaling.connection.js";

@Injectable()
export class WebrtcController {
    private rooms = new Map<string, ServerRoom>();

    constructor(private parser: TokenParser) {
    }

    public async handleConnection(socket: WebSocket) {
        const connections = new Map<SignalingConnection, ServerRoom>();
        socket.on('message', async (msg: Buffer) => {
            try {
                const registerMessage = await this.GetRegistrationMessage(msg);
                if (!registerMessage) return;
                const userInfo: UserInfo = {
                    user: registerMessage.token.User, accessMode: registerMessage.token.AccessMode
                }
                const room = this.rooms.getOrAdd(registerMessage.room, name => new ServerRoom(name));
                const connection = new SignalingConnection(socket, userInfo);
                room.addClient(connection);
                connections.set(connection, room);
            } catch (e) {
                socket.send(JSON.stringify({
                    type: 'exception',
                    message: e.message
                }));
            }
        });
    }

    private async GetRegistrationMessage(msg: Buffer): Promise<{
        room: string; token: { User; AccessMode: 'read' | 'write'; }
    } | undefined> {
        const messageStr = msg.toString('utf8');
        const message = JSON.parse(messageStr) as SignalingMessage;
        console.log(message);
        if (message.type !== 'register') {
            return undefined;
        }
        const token = await this.parser.Parse(message.info.token);
        if (!token) {
            throw new Error(`Unauthorized access ${message.info.room}`);
        }
        return ({
            room: message.info.room, token: token
        });
    }
}