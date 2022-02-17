import {Fn, Injectable} from "@cmmn/core";
import {SyncStore} from "@cmmn/sync";
import {DrawingFigureJson} from "../drawer/types";
import {YjsWebRTCProvider} from "@cmmn/sync/webrtc/client";

@Injectable()
export class StoreFactory {
    constructor() {
    }

    //
    private webRtcProvider = new YjsWebRTCProvider(
        ["ws://localhost:3005"]
    );

    private stores = new Map<string, SyncStore<DrawingFigureJson>>();
    private user = Fn.ulid();

    public getStore(name: string = 'default') {
        return this.stores.getOrAdd(name, name => {
            const store = new SyncStore<DrawingFigureJson>(name);
            store.useIndexedDB();
            const room = this.webRtcProvider.joinRoom(name, {
                user: this.user,
                token: this.user
            });
            room.addAdapter(store.adapter);
            return store;
        });
    }
}