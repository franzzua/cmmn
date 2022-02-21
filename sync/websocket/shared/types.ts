import {UserInfo} from "../../shared/token-parser";

export type WebSocketRegisterMessage = {
    type: 'register';
    token: string;
    room: string;
}

export type WebSocketDataMessage = {
    room: string;
    type: number;
    data: any;
}

export type WebSocketMessage = WebSocketRegisterMessage | WebSocketDataMessage;