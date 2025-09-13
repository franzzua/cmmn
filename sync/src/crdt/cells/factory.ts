import {Scheme, Infer} from "./types";
import {LoroDoc} from 'loro-crdt';

export function factory<Model extends Scheme>(doc: LoroDoc, shape: Model, path = []): Infer<Model> {
	if (typeof shape === "function")
		return shape(doc, path.join('.') || 'root') as Infer<Model>;

	const result = {} as Infer<Model>;
	for (let key in shape) {
		result[key as any] = factory(doc, shape[key] as Model, path.concat(key));
	}
	return result;
}