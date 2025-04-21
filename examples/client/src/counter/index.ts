import {di} from "@cmmn/core";
import {P2PAuth, P2PNode, StorageProvider} from "@cmmn/sync";
import {MainP2PNode} from "./mainP2PNode";
import {IndexedStorage} from "@cmmn/ui";
import {CounterAuth} from "./counter-repository";

export {Counters} from "./counters";

di.override(P2PNode, MainP2PNode);
di.override(StorageProvider, IndexedStorage.Provider);
di.override(P2PAuth, CounterAuth);