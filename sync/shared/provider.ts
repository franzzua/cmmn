import {DocAdapter} from "./doc-adapter.js";

export interface ISyncProvider{
    addAdapter(docAdapter: DocAdapter): void | Promise<void>;
}