import {DocAdapter} from "./doc-adapter";

export interface ISyncProvider{
    addAdapter(docAdapter: DocAdapter): void | Promise<void>;
}