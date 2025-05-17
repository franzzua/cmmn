import {LoroShape} from "./types";
import {Container, LoroCounter, LoroDoc} from "loro-crdt";

export function extend<
	TContainer extends Container,
	TExtension extends Extension<TContainer, TShape>,
	TShape extends LoroShape,
>(container: TContainer, extender: { prototype: TExtension }, doc: LoroDoc, shape?: TShape): TExtension {
	return Object.create(container, {
		base: {value: container},
		doc: {value: doc},
		commit: {value: () => doc.commit()},
		shape: {value: shape},
		...Object.getOwnPropertyDescriptors(extender.prototype)
	})
}

export type LoroDocExtensions<T, Shape> = {
	base: T;
	doc: LoroDoc;
	commit();
	shape?: Shape
}


export type Extension<TContainer extends Container, TShape extends LoroShape> = (new (
	base: TContainer,
	doc: LoroDoc,
	commit: () => void,
	shape?: LoroShape
) => TContainer) | (new (
	base: TContainer,
	doc: LoroDoc,
	commit: () => void,
) => TContainer)