import {LoroDoc, Container} from 'loro-crdt/bundler';
import {LWWValue} from "./types";

export function lww<T>(doc: LoroDoc, id: string): LWWValue<T> {
	const rootMap = doc.getMap('root');
	return {
		get() {
			return rootMap.get(id) as T;
		},
		set(value: T) {
			return rootMap.set(id, value as Exclude<T, Container>);
		},
	}
}