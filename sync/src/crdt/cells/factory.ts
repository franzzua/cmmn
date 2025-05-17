import {LoroShape, LoroShaped} from "./types";
import {LoroDoc} from "loro-crdt";

export function factory<Model extends LoroShape>(doc: LoroDoc, shape: Model, path = []): LoroShaped<Model> {
	if (typeof shape === "function")
		return shape(doc, path.join('.') || 'root') as LoroShaped<Model>;

	const result = {} as LoroShaped<Model>;
	for (let key in shape) {
		result[key as any] = factory(doc, shape[key] as Model, path.concat(key));
	}
	return result;
}