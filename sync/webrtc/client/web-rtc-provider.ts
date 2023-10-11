import {AnnounceEvent, SignalEvent, SignalingConnection} from "./signaling-connection.js";
import {bind} from '@cmmn/core';
import {SignalClientMessage} from "../shared/types.js";
import {Room, RoomOptions} from "./room.js";
import {DataChannelProvider} from "./data-channel-provider.js";
import {cell, Cell} from "@cmmn/cell";

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';
export class WebRtcProvider {
    private readonly signalingConnections: ReadonlyArray<SignalingConnection>;
    private readonly rooms: Map<string, Room> = new Map<string, Room>();
    private peerInitiator = new DataChannelProvider({
        ...this.rtcOptions
    });
    @cell
    public ServerState: Readonly<Record<string, ConnectionState>> = Object.fromEntries(this.signallingServers.map(x => [x, 'disconnected']));

    constructor(
        private signallingServers: string[],
        private rtcOptions: RTCConfiguration = undefined
    ) {
        this.signalingConnections = signallingServers.map(this.createSignallingConnection)
    }

    public joinRoom(roomName: string, options: RoomOptions) {
        const room = new Room(roomName, options, this.peerInitiator);
        this.rooms.set(roomName, room);
        this.signalingConnections.forEach(x => room.addSignalingConnection(x));
        return room;
    }

    public leaveRoom(roomName: string) {
        this.rooms.get(roomName).disconnect();
    }

    @bind
    private async onSignal(msg: SignalEvent) {
        if (msg.signal.type === "offer") {
            this.peerInitiator.withOffer(msg.from, msg.signal, (pc, room) => {
                this.rooms.get(room).addConnection(pc);
            });
        }
    }

    @bind
    private onAnnounce(msg: AnnounceEvent) {
        this.rooms.get(msg.room).setUsers(msg.users);
    }

    /** @internal **/
    public sendSignal(msg: SignalClientMessage) {
        this.signalingConnections.forEach(s => s.sendSignal(msg));
    }

    @bind
    private createSignallingConnection(url: string): SignalingConnection {
        const connection = new SignalingConnection(url);
        connection.on('signal', this.onSignal);
        connection.on('announce', this.onAnnounce);
        connection.on('disconnected', () => this.ServerState = {
            ...this.ServerState,
            [url]: 'disconnected'
        });
        connection.on('connected', () => this.ServerState = {
            ...this.ServerState,
            [url]: 'connected'
        });
        connection.on('connecting', () => this.ServerState = {
            ...this.ServerState,
            [url]: 'connected'
        });
        return connection;
    }

    public async dispose() {
        this.peerInitiator.dispose();
        for (let value of this.rooms.values()) {
            await value.disconnect()
        }
    }

}

