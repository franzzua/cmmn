import type {List} from "./list";
import type {Counter} from "./counter";
import {Text} from "./text";
import {Map} from "./map";
import {LoroDocCell} from "./loro-doc-cell";
import {LoroDoc} from "loro-crdt";

export type LoroType = List<any> | Counter | Text | Map<any>;
type LoroTypeFactory = (cell: LoroDoc, id: string) => LoroType;

export type LoroShape = {
	[key: string]: LoroShape;
} | LoroTypeFactory;

export type LoroShaped<Shape extends LoroShape> = Shape extends ((...args: unknown[]) => infer T) ? T
	: (Shape extends object ? {
		[key in keyof Shape]: LoroShaped<Shape[key] & LoroShape>;
	} : Shape);

