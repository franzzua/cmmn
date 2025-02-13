import { EventEmitter } from '@cmmn/core';

const EventCycleEvents = ['animationFrame', 'idle'] as const;
export type EventCycleStep = (typeof EventCycleEvents)[number];

export class EventCycleClass extends EventEmitter<
	Record<EventCycleStep, void>
> {
	override subscribe(eventName: EventCycleStep) {
		this.handles[eventName] = this.subscribers[eventName].call(
			undefined,
			this.handlers[eventName],
		);
	}

	override unsubscribe(eventName: EventCycleStep) {
		if (this.handles[eventName])
			this.unsubscribers[eventName].call(undefined, this.handles[eventName]);
	}

	private handles: Partial<Record<EventCycleStep, number>> = {};
	private subscribers: Record<
		EventCycleStep,
		(listener: () => void) => number
	> = {
		animationFrame: globalThis.requestAnimationFrame,
		idle: globalThis.requestIdleCallback,
	};
	private unsubscribers: Record<EventCycleStep, (handler: number) => void> = {
		animationFrame: globalThis.cancelAnimationFrame,
		idle: globalThis.cancelIdleCallback,
	};

	private handlers = Object.fromEntries(
		EventCycleEvents.map((event) => [
			event,
			() => {
				this.handles[event] = this.subscribers[event].call(
					undefined,
					this.handlers[event],
				);
				this.emit(event);
			},
		]),
	);
}

export const EventCycle = new EventCycleClass();
