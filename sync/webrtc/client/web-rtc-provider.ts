import {AnnounceEvent, SignalEvent, SignalingConnection} from "./signaling-connection";
import {bind} from '@cmmn/core';
import {SignalClientMessage} from "../shared/types";
import {Room, RoomOptions} from "./room";
import {DataChannelProvider} from "./data-channel-provider";

export class WebRtcProvider {
    private readonly signalingConnections: ReadonlyArray<SignalingConnection>;
    private readonly rooms: Map<string, Room> = new Map<string, Room>();
    private peerInitiator = new DataChannelProvider({
        ...this.rtcOptions
    })

    constructor(
        signallingServers: string[],
        private rtcOptions: RTCConfiguration = undefined
    ) {
        this.signalingConnections = signallingServers.map(this.createSignallingConnection)
    }

    public joinRoom(roomName: string, options: RoomOptions) {
        const room = new Room(roomName, options, this.peerInitiator);
        this.rooms.set(roomName, room);
        const regInfo = room.getRegistrationInfo();
        this.signalingConnections.forEach(x => x.register(regInfo));
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
        this.rooms.get(msg.room).addUsers(msg.users);
    }

    /** @internal **/
    public sendSignal(msg: SignalClientMessage) {
        this.signalingConnections.forEach(s => s.sendSignal(msg));
    }

    @bind
    private createSignallingConnection(url: string): SignalingConnection {
        const connection = new SignalingConnection(new WebSocket(url));
        connection.on('signal', this.onSignal);
        connection.on('announce', this.onAnnounce);
        return connection;
    }

    public async dispose() {
        this.peerInitiator.dispose();
        for (let value of this.rooms.values()) {
            await value.disconnect()
        }
    }

}

