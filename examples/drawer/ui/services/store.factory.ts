import {Fn, Injectable} from "@cmmn/core";
import {YjsWebRTCProvider} from "@cmmn/sync/webrtc/client";
import {SyncStore} from "@cmmn/sync/store/sync.store";
import {DrawingFigure} from "../drawer/model";

@Injectable()
export class StoreFactory {
    constructor() {
    }

    private webRtcProvider = new YjsWebRTCProvider(
        ["ws://localhost:3001"]
    );

    public getStore(){
        const store = new SyncStore<DrawingFigure>();
        const room = this.webRtcProvider.joinRoom('default', {
            user: Fn.ulid(),
        });
        room.addAdapter(store.adapter);
        return store;
    }
}