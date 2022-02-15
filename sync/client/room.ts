import {Awareness} from "y-protocols/awareness";
import {Doc} from "yjs";
import {SignalData} from "simple-peer";
import {SignalingRegistrationInfo} from "../shared/types";
import {UserInfo} from "./signaling-connection";
import {DocAdapter} from "./doc-adapter";
import {DataChannelProvider} from "./data-channel-provider";
import {PeerConnection} from "./peer-connection";

export class Room {
    private users = new Map<string, UserInfo>();

    private docAdapter = new DocAdapter(this.doc, this.options.awareness ?? new Awareness(this.doc));

    constructor(private roomName: string,
                private doc: Doc,
                private options: RoomOptions,
                private peerFactory: DataChannelProvider) {

    }


    public getRegistrationInfo(): SignalingRegistrationInfo {
        return {
            room: this.roomName,
            token: this.options.token
        }
    }

    public async connect() {

    }

    public async disconnect() {
    }

    public async addUsers(users: UserInfo[]) {
        for (let user of users) {
            this.users.set(user.user, user);
            if (user.user > this.options.user)
                this.setConnection(user);
        }
    }


    private async setConnection(user: UserInfo) {
        const connection = await this.peerFactory.getConnection(user, this.roomName, this.options.user)
        this.docAdapter.connect(connection);
        return connection;
    }

    public addConnection(connection: PeerConnection) {
        this.docAdapter.connect(connection);
        return connection;
    }
}


export type RoomOptions = {
    awareness?: Awareness;
    token?: string;
    user: string;
    maxConnections?: number;
    useBroadcast?: boolean;
    peerOpts?: RTCConfiguration;
}
