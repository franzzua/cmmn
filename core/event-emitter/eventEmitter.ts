import { EventEmitterBase } from './eventEmitterBase';
import { removeAll } from '../helpers';

export class EventEmitter<TEvents> extends EventEmitterBase<TEvents> {
	protected listeners = new Map<
		keyof TEvents,
		Array<{
			listener: (data, stop?) => void;
			options: SubscriptionOptions;
		}>
	>();

	public on<
		TEventName extends keyof TEvents,
		TSubscriptionOptions extends SubscriptionOptions = SubscriptionOptions,
	>(
		eventName: TEventName,
		listener: (data: TEvents[TEventName]) => void,
		options?: TSubscriptionOptions,
	) {
		if (!this.listeners.has(eventName)) {
			this.listeners.set(eventName, []);
			this.subscribe(eventName);
		}
		if (options?.signal) {
			options.signal.addEventListener(
				'abort',
				() => {
					this.off(eventName, listener);
				},
				{ once: true },
			);
		}
		const arr = this.listeners.get(eventName);
		arr.push({ listener, options: options });
		return () => this.off(eventName, listener);
	}

	public off<TEventName extends keyof TEvents>(
		eventName: TEventName,
		listener: (data: TEvents[TEventName]) => void,
	) {
		const set = this.listeners.get(eventName) ?? [];
		removeAll(set, (x) => x.listener === listener);
		if (set.length === 0) {
			this.listeners.delete(eventName);
			this.unsubscribe(eventName);
		}
	}

	protected subscribe(eventName: keyof TEvents) {}

	protected unsubscribe(eventName: keyof TEvents) {}

	public emit<TEventName extends keyof TEvents>(
		eventName: TEventName,
		data?: TEvents[TEventName],
	) {
		const arr = this.listeners.get(eventName);
		if (!arr) return;
		arr.slice().forEach((x) => x.listener(data));
	}

	public [Symbol.dispose]() {
		this.emit(Symbol.dispose as keyof TEvents);
		for (const [key, value] of this.listeners) {
			for (const listener of value) {
				this.off(key, listener.listener);
			}
		}
	}
}

export type SubscriptionOptions = {
	signal?: AbortSignal;
};
