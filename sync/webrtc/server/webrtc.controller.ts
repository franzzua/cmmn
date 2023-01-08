import {Injectable} from "@cmmn/core";
import {WebSocket} from "ws";
import {SignalingMessage, UserInfo} from "../shared/types";
import {ServerRoom} from "./server-room";
import {TokenParser} from "../../shared/token-parser";
import {SignalingConnection} from "./signaling.connection";

@Injectable()
export class WebrtcController {
    private rooms = new Map<string, ServerRoom>();
    private subscribedTopics = new Set<ServerRoom>();

    constructor(private parser: TokenParser) {
    }

    public async handleConnection(socket: WebSocket) {
        try {
            const registerMessage = await this.GetRegistrationMessage(socket);
            if (!registerMessage)
                return;
            const userInfo: UserInfo = {
                user: registerMessage.token.User,
                accessMode: registerMessage.token.AccessMode
            }
            console.log(userInfo.user);
            const room = this.rooms.getOrAdd(registerMessage.room, name => new ServerRoom(name));
            const connection = new SignalingConnection(socket, userInfo);
            room.addClient(connection);
            this.subscribedTopics.add(room);
        } catch (e) {
            return e ? (e.message ?? e) : 'unknown error';
        }
    }

    private async GetRegistrationMessage(socket: WebSocket): Promise<{
        room: string;
        token: { User; AccessMode: 'read' | 'write'; }
    }> {
        return new Promise((resolve, reject) => {
            const handler = async (msg: Buffer) => {
                const messageStr = msg.toString('utf8');
                const message = JSON.parse(messageStr) as SignalingMessage;
                console.log(message);
                if (message.type !== 'register') {
                    return;
                }
                socket.off('message', handler);
                const token = await this.parser.Parse(message.info.token);
                if (!token) {
                    reject(new Error('unauthorized'));
                }
                resolve({
                    room: message.info.room,
                    token: token
                });
            };
            socket.on('message', handler);
        });
    }
}