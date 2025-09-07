import {bind, cell, ObservableMap, scoped, singleton} from "@cmmn/core";

@singleton()
export class DraggableContext {
	constructor() {
		console.log(this)
	}
	targets = new ObservableMap<Node, any>();

	@cell()
	accessor draggable: Node;
	@cell()
	accessor position: { x: number; y: number };
	@cell()
	accessor hovered: any[] = [];
	@cell()
	accessor draggableData: any;

	get transform() {
		if (!this.position) return undefined;
		return `translate(${this.position.x}px, ${this.position.y}px)`
	};


	@bind()
	setTarget(data: any) {
		return (root: HTMLDivElement | null): () => void => {
			if (!root) return;
			this.targets.set(root, data);
			return () => this.targets.delete(root);
		};
	}
	@bind()
	setDraggable(data: any) {
		return (root: HTMLElement) => {
			if (!root) return;
			const abortRoot = new AbortController();
			root.addEventListener('pointerdown', e => {
				const abort = new AbortController();
				root.addEventListener('pointermove', e => {
					root.setPointerCapture(e.pointerId);
					this.draggable ??= root.cloneNode(true);
					this.draggableData = data;
					this.position = {x: e.pageX, y: e.pageY};
					this.hovered = document.elementsFromPoint(e.pageX, e.pageY)
						.map(x => this.targets.get(x))
						.filter(x => x != null);
				}, {passive: true, signal: abort.signal})
				root.addEventListener('pointerup', e => {
					this.draggable = null;
					this.position = null;
					root.releasePointerCapture(e.pointerId);
					abort.abort();
				}, {passive: true, signal: abort.signal});
				document.addEventListener('selectstart', e => e.preventDefault(), abort);
			}, abortRoot);
			return () => abortRoot.abort();
		}
	}
}