import "./app";

import {StorageProvider} from '@cmmn/sync/storage';
import {IndexedStorage} from "@cmmn/ui";
import {di} from "@cmmn/core";
di.override(StorageProvider, IndexedStorage.Provider);
