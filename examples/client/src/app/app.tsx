import {type Api, ApiToken, Store} from './store';
import {useCelled} from "@cmmn/react";
import {JsxElement} from "typescript";

export const App = (props) => useCelled((store, api: Api) => (
	<div style={{display: 'flex', gap: '1em'}}>
		Hi there: <span>{store.value}</span>
		Query: <span>{JSON.stringify(api.query.get())}</span>
		<button onClick={() => store.value++}>Inc</button>
		<button onClick={() => api.query.fetch()}>Refetch</button>
	</div> as JsxElement
), Store, ApiToken);
