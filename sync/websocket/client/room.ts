import {WebsocketConnection} from "./websocket-connection.js";
import {DataConnection} from "./data-connection.js";
import {DocAdapter} from "../../shared/doc-adapter.js";
import {ISyncProvider} from "../../shared/provider.js";

export class Room implements ISyncProvider{
    private adapters = new Set<DocAdapter>();
    private dataConnection = new DataConnection(this.connection, this.roomName);

    constructor(private connection: WebsocketConnection,
                private roomName: string) {
    }


    public addAdapter(docAdapter: any) {
        docAdapter.connect(this.dataConnection);
        this.adapters.add(docAdapter);
    }
}

