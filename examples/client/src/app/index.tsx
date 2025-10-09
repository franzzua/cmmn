import { createRoot } from 'react-dom/client';
import { App } from './app';
import {StorageProvider} from '@cmmn/sync/storage';
import {IndexedStorage} from "@cmmn/ui";
import {di} from "@cmmn/core";
di.override(StorageProvider, IndexedStorage.Provider);

createRoot(document.getElementById('root')).render((
	<App />
));
