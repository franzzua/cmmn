import { createRoot } from 'react-dom/client';
import { App } from './app';
import {StrictMode} from "react";
import {Movable} from "../movable/movable";

createRoot(document.getElementById('root')).render((
	<App />
));
