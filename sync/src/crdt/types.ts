import {LoroCell} from "./cells/loro-cell";

export type LoroShaped<Shape extends LoroShape> = {
	[key in keyof Shape]: Shape[key] extends ((...args: unknown[]) => infer T) ? T : LoroShaped<Shape[key]>;
}
export type LoroType = |
	| typeof LoroCell.List
	| typeof LoroCell.Counter
	;
export type LoroShape = Record<string, LoroShape | LoroType>;
