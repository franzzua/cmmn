import { Hole, render } from 'uhtml';
import { bind, Cell, EventEmitter } from '@cmmn/core';

export abstract class Component extends HTMLElement {
	static readonly componentName: string;
	attributeChangedCallback(key, oldValue, newValue) {
		if (key in this)
			this[key] = newValue;
	}

	public connectedCallback() {
		this.dispatchEvent(new Event('connected'));
		this.injectedChildren = Array.from(this.children);
		for (let child of Array.from(this.children)) {
			child.remove();
		}
		this.hole.on('change', this.syncHtml);
		this.syncHtml({ value: this.hole.get() });
	}

	public disconnectedCallback() {
		this.dispatchEvent(new Event('disconnected'));
		Component.GlobalEvents.emit('disconnected', this);
		this.hole.off('change', this.syncHtml);
		this[Symbol.dispose]?.();
	}

	public onError(
		error,
		source: 'effect' | 'action' | 'state' | 'template',
		sourceName?,
	) {
		console.groupCollapsed(
			this.constructor.name,
			`${source} ${sourceName ?? ''}`,
		);
		console.warn(error);
		console.groupEnd();
	}

	static GlobalEvents = new EventEmitter<{
		disconnected: Component;
		connected: Component;
		render: { target: Component; state: any };
	}>();

	protected hole = new Cell(() => this.render());

	abstract render(): Hole;

	@bind()
	private async syncHtml(change: { value: Hole }) {
		Component.render(this, change.value);
	}

	static renderTasks = new Map<Component, Hole>();
	static renderQueueId: number;
	static render(component: Component, hole: Hole){
		this.renderTasks.set(component, hole);
		this.renderQueueId ??= requestAnimationFrame(this.runRender);
	}
	static runRender(){
		Component.renderQueueId = undefined;
		for (let [component, hole] of Component.renderTasks) {
			render(component, hole);
			component.renderCallback();
		}
		Component.renderTasks.clear();
	}

	protected renderCallback() {
		this.dispatchEvent(new Event('render'));
	}

	protected injectedChildren: Element[];

	public onrender: ((this: Component, ev: Event) => any) | null;
	public onconnected: ((this: Component, ev: Event) => any) | null;
	public events = Cell.events(this as Component);
}