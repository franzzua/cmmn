import { Hole, render } from 'uhtml';
import { bind, Cell, EventEmitter } from '@cmmn/core';
import { EventCycle } from '../user-events/event-cycle';

export abstract class Component extends globalThis.HTMLElement {
	attributeChangedCallback(key, oldValue, newValue) {
		this[key] = newValue;
	}

	public connectedCallback() {
		this.dispatchEvent(new Event('connected'));
		this.injectedChildren = Array.from(this.children);
		for (let child of Array.from(this.children)) {
			child.remove();
		}
		this.hole.on('change', this.syncHtml);
		this.syncHtml();
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
	private async syncHtml() {
		await EventCycle.onceAsync('animationFrame');
		render(this, this.hole.get());
		this.dispatchEvent(new Event('render'));
		this.renderCallback();
	}

	protected renderCallback() {}

	protected injectedChildren: Element[];
}
