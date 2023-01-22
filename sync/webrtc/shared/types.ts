import type {UserInfo} from "../../shared/token-parser";

export enum MessageType {
    UpdateRequest = 0,
    Update = 7,
    AwarenessRequest = 3,
    Awareness = 1,

    AddPeer = 4,
    RemovePeer = 5
};

export type SignalClientMessage = {
    to: string;
    type: 'signal';
    signal: SignalData
};
export type SignalData = RTCSessionDescriptionInit | {
    type: "candidate",
    candidate: RTCIceCandidate
} | {
    type: "datachannel",
    room: string,
    id: number
};

export type SignalServerMessage = SignalClientMessage & {
    from: UserInfo;
}

export type SignalingRegistrationInfo = {
    room: string;
    token: string;
}

export type SignalingRegisterMessage = {
    type: 'register';
    info: SignalingRegistrationInfo;
};

export type AnnounceMessage = {
    room: string;
    type: 'announce';
    users: UserInfo[];
}

export {UserInfo};


export type SignalingMessage = SignalingRegisterMessage | SignalClientMessage;
export type SignalingServerMessage = SignalServerMessage | AnnounceMessage;