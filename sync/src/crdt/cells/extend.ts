import {Scheme} from "./types";
import {Container, LoroCounter, LoroDoc} from 'loro-crdt/nodejs';

export function extend<
	TContainer extends Container,
	TExtension extends Extension<TContainer, TShape>,
	TShape extends Scheme,
>(container: TContainer, extender: { prototype: TExtension }, doc: LoroDoc, shape?: TShape): TExtension {
	return Object.create(container, {
		base: {value: container},
		doc: {value: doc},
		commit: {value: () => doc.commit()},
		shape: {value: shape},
		...Object.getOwnPropertyDescriptors(extender.prototype)
	})
}

export type LoroDocExtensions<T> = {
	base: T;
	doc: LoroDoc;
	commit();
	shape?: Scheme
}


export type Extension<TContainer extends Container, TShape extends Scheme> = (new (
	base: TContainer,
	doc: LoroDoc,
	commit: () => void,
	shape?: Scheme
) => TContainer) | (new (
	base: TContainer,
	doc: LoroDoc,
	commit: () => void,
) => TContainer)