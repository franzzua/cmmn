import * as Y from "yjs";
import {applyUpdate, Doc} from "yjs";
import {PeerDataChannel} from "./peer-data-channel";
import * as awarenessProtocol from 'y-protocols/awareness.js'
import {Awareness} from 'y-protocols/awareness.js'
import {bind, EventEmitter, Fn} from "@cmmn/core";
import {MessageType} from "../webrtc/shared/types";
import { PeerConnection } from "../webrtc/client/peer-connection";
type UnsubscribeFunction = () => void;
export class DocAdapter extends EventEmitter<{
    dispose: void;
}>{
    private connections = new Map<PeerDataChannel, UnsubscribeFunction>();

    constructor(public doc: Doc, private awareness: Awareness) {
        super();
        this.doc.on('update', (update, _, doc, transaction) => {
            if (transaction.local)
                this.broadcast(MessageType.Update, update);
        });
    }

    public connect(connection: PeerDataChannel) {
        console.log('doc connected to', connection.accessMode);
        const onDispose = Fn.pipe(
            connection.on(MessageType.UpdateRequest, stateVector => {
                connection.send(MessageType.Update, Y.encodeStateAsUpdate(this.doc, stateVector));
            }),
            connection.on(MessageType.AwarenessRequest, () => {
                connection.send(MessageType.Awareness, this.getAwarenessMessage());
            }),
            connection.on(MessageType.Awareness, this.applyAwarenessUpdate),
            connection.on(MessageType.Update, this.applyUpdate),

            connection.once('close', () => {
                this.connections.delete(connection);
            })
        );
        this.connections.set(connection, onDispose);

        connection.send(MessageType.UpdateRequest, this.getStateVector());
        connection.send(MessageType.Awareness, this.getAwarenessMessage());
    }

    private broadcast(type: MessageType, data: Uint8Array) {
        for (let connection of this.connections.keys()) {
            connection.send(type, data);
        }
    }

    public getAwarenessMessage(changedClients = [this.doc.clientID]) {
        return awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients);
    }

    @bind
    public applyUpdate(update: Uint8Array) {
        // TODO: specify origin
        applyUpdate(this.doc, update, 'origin');
    }

    @bind
    public applyAwarenessUpdate(update: Uint8Array) {
        // TODO: specify origin
        awarenessProtocol.applyAwarenessUpdate(this.awareness, update, 'origin')
    }

    public getStateVector() {
        return Y.encodeStateVector(this.doc);
    }

    public disconnect(connection: PeerConnection) {
        this.connections.get(connection)?.();
        this.connections.delete(connection);
    }

    public dispose(){
        this.emit('dispose');
        for (let unsubscribe of this.connections.values()) {
            unsubscribe();
        }
        super.dispose();
    }
}