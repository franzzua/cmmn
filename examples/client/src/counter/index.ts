import {di} from "@cmmn/core";
import {P2PNode, StorageProvider} from "@cmmn/sync";
import {MainP2PNode} from "./mainP2PNode";
import {IndexedStorage} from "@cmmn/ui";

export {Counters} from "./counters";

di.override(P2PNode, MainP2PNode);
di.override(StorageProvider, IndexedStorage.Provider);