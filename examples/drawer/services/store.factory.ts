import {Fn, Injectable} from "@cmmn/core";
import {SyncStore} from "@cmmn/sync";
import type {DrawingFigureJson} from "../drawer/types";
import {WebsocketProvider} from "@cmmn/sync/websocket/client";

@Injectable()
export class StoreFactory {
    constructor() {
    }

    private webSocketProvider = new WebsocketProvider("ws://localhost:3005");
    //
    // private webRtcProvider = new YjsWebRTCProvider(
    //     ["ws://localhost:3005"]
    // );

    private stores = new Map<string, SyncStore<DrawingFigureJson>>();
    private user = Fn.ulid();

    public getStore(name: string = 'default') {
        return this.stores.getOrAdd(name, name => {
            const store = new SyncStore<DrawingFigureJson>(name);
            store.useIndexedDB();
            const room = this.webSocketProvider.joinRoom(name, {
                user: this.user,
                token: this.user
            });
            room.addAdapter(store.adapter);
            return store;
        });
    }
}