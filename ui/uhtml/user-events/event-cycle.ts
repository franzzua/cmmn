import {EventEmitter} from "@cmmn/core";

const EventCycleEvents = ['animationFrame', 'idle'] as const;
export type EventCycleStep = (typeof EventCycleEvents)[number];

export class EventCycleClass extends EventEmitter<Record<EventCycleStep, void>> {
    override subscribe(eventName: EventCycleStep){
        this.subscribers[eventName](this.handlers[eventName]);
    }

    override unsubscribe(eventName: EventCycleStep){
        this.unsubscribers[eventName](this.handles[eventName]);
    }

    private handles: Partial<Record<EventCycleStep, number>> = {};
    private subscribers: Record<EventCycleStep, (listener: () => void) => number> = {
        animationFrame: requestAnimationFrame,
        idle: requestIdleCallback
    };
    private unsubscribers: Record<EventCycleStep, (handler: number) => void> = {
        animationFrame: cancelAnimationFrame,
        idle: cancelIdleCallback
    };

    private handlers = Object.fromEntries(EventCycleEvents.map(event => [event, () => {
        this.emit(event);
        this.handles[event] = this.subscribers[event](this.handlers[event]);
    }]));
}

export const EventCycle = new EventCycleClass();