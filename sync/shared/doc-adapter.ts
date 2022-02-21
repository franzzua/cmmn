import * as Y from "yjs";
import {applyUpdate, Doc} from "yjs";
import {PeerDataChannel} from "./peer-data-channel";
import * as awarenessProtocol from 'y-protocols/awareness'
import {Awareness} from 'y-protocols/awareness'
import {bind} from "@cmmn/core";
import {MessageType} from "../webrtc/shared/types";

export class DocAdapter {
    private connections = new Set<PeerDataChannel>();

    constructor(public doc: Doc, private awareness: Awareness) {
        this.doc.on('update', (update, _, doc, transaction) => {
            if (transaction.local)
                this.broadcast(MessageType.Update, update);
        });
    }

    public connect(connection: PeerDataChannel) {
        this.connections.add(connection);

        connection.on(MessageType.UpdateRequest, stateVector => {
            connection.send(MessageType.Update, Y.encodeStateAsUpdate(this.doc, stateVector));
        });
        connection.on(MessageType.AwarenessRequest, () => {
            connection.send(MessageType.Awareness, this.getAwarenessMessage());
        });
        connection.on(MessageType.Awareness, this.applyAwarenessUpdate);
        connection.on(MessageType.Update, this.applyUpdate);

        connection.once('close', () => {
            this.connections.delete(connection);
        });

        connection.send(MessageType.UpdateRequest, this.getStateVector());
        connection.send(MessageType.Awareness, this.getAwarenessMessage());
    }

    private broadcast(type: MessageType, data: Uint8Array) {
        for (let connection of this.connections) {
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
}