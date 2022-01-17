import {Cell} from "cellx";
import {HotCell} from "./hot-cell";

export function fromEvent<TEvent extends Event,
    TTarget extends EventTarget = EventTarget,
    >(target: TTarget, eventname: string, options?: EventListenerOptions): Cell<TEvent> {
    return new EventCell<TEvent>(target, eventname, options);
}


export class EventCell<TEvent> extends HotCell<TEvent> {
    private Listener(event: TEvent) {
        this.set(event);
    }

    private listener = this.Listener.bind(this);

    constructor(private target: EventTarget, private eventName: string, private options?: EventListenerOptions) {
        super();
    }

    protected Subscribe() {
        this.target.addEventListener(this.eventName, this.listener, this.options);
    }

    protected Unsubscribe() {
        this.target.removeEventListener(this.eventName, this.listener, this.options);
    }

}
