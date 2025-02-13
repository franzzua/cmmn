import { store } from './store';

export const App = () => {
	return (
		<div>
			Hi their:
			<span>{store.get()}</span>
			<button onClick={() => store.set(store.get() + 1)}>Increment</button>
		</div>
	);
};
