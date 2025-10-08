import {EventEmitter} from "@cmmn/core";

export class EventListener<TEvents> extends EventEmitter<TEvents> {
	constructor(private target: Omit<EventTarget, 'dispatchEvent'>) {
		super();
	}

	private _emitters: {
		[key in keyof TEvents]?: (data: TEvents[key]) => unknown;
	} = {};

	protected subscribe(eventName: keyof TEvents) {
		if (!this._emitters[eventName])
			this._emitters[eventName] = ((data) => this.emit(eventName, data)) as never;
		this.target.addEventListener(
			eventName as string,
			this._emitters[eventName] as any,
		);
	}

	protected unsubscribe(eventName: keyof TEvents) {
		this.target.removeEventListener(
			eventName as string,
			this._emitters[eventName] as any,
		);
	}

	public static onceAsync(target: EventTarget, event: string) {
		return new EventListener<Record<string, any>>(target).onceAsync(event);
	}
}
