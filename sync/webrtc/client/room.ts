import {SignalingRegistrationInfo} from "../shared/types";
import {SignalingConnection, UserInfo} from "./signaling-connection";
import {DocAdapter} from "../../shared";
import {DataChannelProvider} from "./data-channel-provider";
import {PeerConnection} from "./peer-connection";
import {networkFactory, Network} from "../networks";

export class Room {
    private signalConnections = new Set<SignalingConnection>();
    private connections = new Set<PeerConnection>();
    private adapters = new Set<DocAdapter>();

    private network: Network;
    private users: UserInfo[] = [];

    constructor(private roomName: string,
                private options: RoomOptions,
                private peerFactory: DataChannelProvider) {

    }

    public addSignalingConnection(connection: SignalingConnection){
        if (this.signalConnections.has(connection)){
            return;
        }
        this.signalConnections.add(connection);
        connection.on('connected', () =>{
            connection.register(this.getRegistrationInfo());
        });
        connection.once('disconnected', () => {
        });
    }


    public getRegistrationInfo(): SignalingRegistrationInfo {
        return {
            room: this.roomName,
            token: this.options.token
        }
    }

    public async setUsers(users: UserInfo[]) {
        this.users = users;
        const usersMap = new Map(users.map(x => [x.user, x]));
        this.network = networkFactory(this.options.user, Array.from(usersMap.keys()));
        this.onNetworkUpdate();
    }

    private onNetworkUpdate(){
        const usersMap = new Map(this.users.map(x => [x.user, x]));
        for (let connection of this.connections.values()) {
            const connected = this.network.isConnectedTo(connection.user.user);
            if (!connected){
                connection.dispose();
                this.connections.delete(connection);
            }
        }
        const connectedUsers = new Set(Array.from(this.connections).map(x => x.user.user));
        this.network.map.forEach(({connected}, user) => {
            if (!connectedUsers.has(user)){
                this.setConnection(usersMap.get(user));
            }
        });
    }

    private async setConnection(user: UserInfo) {
        const connection = await this.peerFactory.getConnection(user, this.roomName, this.options.user)
        connection.on('close', () => {
            for (let adapter of this.adapters) {
                adapter.disconnect(connection);
            }
            this.connections.delete(connection);
            connection.dispose();
            if (this.network.isConnectedTo(user.user)) {
                this.setConnection(user);
            }
        })
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
        docAdapter.on('dispose', () => {
            this.adapters.delete(docAdapter);
            for (let connection of this.connections) {
                docAdapter.disconnect(connection);
            }
        })
        this.adapters.add(docAdapter);
    }

    public disconnect() {
        for (let connection of this.connections) {
            for (let adapter of this.adapters) {
                adapter.disconnect(connection);
            }
        }
    }
}


export type RoomOptions = {
    token?: string;
    user: string;
    maxConnections?: number;
    useBroadcast?: boolean;
    peerOpts?: RTCConfiguration;
}
