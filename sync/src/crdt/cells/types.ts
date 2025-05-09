import type {list} from "./list";
import type {counter} from "./counter";

export type LoroTypeFactory = typeof counter | ReturnType<typeof list>;

export type LoroShape = {
	[key: string]: LoroShape;
} | LoroTypeFactory;

export type LoroShaped<Shape extends LoroShape> = Shape extends ((...args: unknown[]) => infer T) ? T
	: (Shape extends object ? {
		[key in keyof Shape]: LoroShaped<Shape[key]>;
	} : Shape);

