import { store } from './store';
import {useCell} from "@cmmn/react";

export const App = () => {
	const value = useCell(store);
	return (
		<div style={{ display: 'flex', gap: '1em' }}>
			Hi there: <span>{value}</span>
			<button onClick={() => store.set(store.get() + 1)}>Increment</button>
		</div>
	);
};
