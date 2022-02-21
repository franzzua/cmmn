import {Awareness} from "y-protocols/awareness";
import {SignalingRegistrationInfo} from "../shared/types";
import {UserInfo} from "./signaling-connection";
import {DocAdapter} from "../../shared/doc-adapter";
import {DataChannelProvider} from "./data-channel-provider";
import {PeerConnection} from "./peer-connection";

export class Room {
    private users = new Map<string, UserInfo>();
    private connections = new Set<PeerConnection>();
    private adapters = new Set<DocAdapter>();

    constructor(private roomName: string,
                private options: RoomOptions,
                private peerFactory: DataChannelProvider) {

    }


    public getRegistrationInfo(): SignalingRegistrationInfo {
        return {
            room: this.roomName,
            token: this.options.token
        }
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
        this.connections.add(connection);
        for (let adapter of this.adapters) {
            adapter.connect(connection);
        }
        return connection;
    }

    public addConnection(connection: PeerConnection) {
        this.connections.add(connection);
        for (let adapter of this.adapters) {
            adapter.connect(connection);
        }
        return connection;
    }

    public addAdapter(docAdapter: DocAdapter) {
        for (let connection of this.connections) {
            docAdapter.connect(connection);
        }
        this.adapters.add(docAdapter);
    }

    public disconnect() {

    }
}


export type RoomOptions = {
    token?: string;
    user: string;
    maxConnections?: number;
    useBroadcast?: boolean;
    peerOpts?: RTCConfiguration;
}
