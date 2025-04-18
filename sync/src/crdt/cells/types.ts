import type {list} from "./list";
import type {counter} from "./counter";

export type LoroShaped<Shape extends LoroShape> = Shape extends ((...args: unknown[]) => infer T) ? T
	: (Shape extends object ? {
		[key in keyof Shape]: LoroShaped<Shape[key]>;
	} : T);

export type LoroTypeFactory = ReturnType<typeof list>
	| typeof counter;

export type LoroShape = Record<string, LoroShape> | LoroTypeFactory;
