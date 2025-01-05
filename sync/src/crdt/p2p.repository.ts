import {inject, singleton} from "@cmmn/core";
import {P2PNode} from "../p2p/p2p.node";
import {LoroCell} from "./loro-cell";

@singleton()
export class P2PRepository {
    @inject(P2PNode) p2pNode!: P2PNode;

    async getDoc(uri: string) {
        const cell = new LoroCell();
        const room = await cell.syncP2P(this.p2pNode, uri);
        return cell;
    }

    async createDoc(uri: string) {
        const cell = new LoroCell();
        const room = await cell.syncP2P(this.p2pNode, uri);
        return cell;
    }

}