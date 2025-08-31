import {BaseCell, Subscriber} from './base-cell';
import {Fn} from "../helpers";
import {subscribe} from "node:diagnostics_channel";
import {EventEmitter, EventEmitterBase} from "../event-emitter";

export type ICellOptions<T, TKey = T> = {
	compare?: (a: TKey, b: TKey) => boolean;
	compareKey?: (value: T) => TKey;
	filter?: (a: T) => boolean;
	tap?: (a: T) => void;
	onExternal?: (a: T) => void;
	startValue?: T;
	// when cell activates it will be active till this disposable lives
	activeWith?: Disposable;
	subscribe?: Subscriber<T, any>;
};

export class Cell<T = unknown, TKey = T> extends BaseCell<T> {
	constructor(
		value: T | (() => T),
		protected options: ICellOptions<T, TKey> = {},
	) {
		super(value);
		if (options.startValue !== undefined) {
			this.update(options.startValue);
		}
		if (this.value !== undefined) {
			// !function || options.startValue !== undefined
			this.handleFilterError(this.value);
			if (options.startValue === undefined) {
				// startValue -> update -> tap
				this.options.tap?.(this.value);
			}
		}
		if (options.activeWith) {
			const dispose = () => {
				options.activeWith = null;
				this.disactive();
			}
			options.activeWith[Symbol.dispose] = options.activeWith[Symbol.dispose] ? Fn.pipe(
				options.activeWith[Symbol.dispose],
				dispose
			) : dispose;
		}
	}

	protected disactive() {
		if (this.options.activeWith)
			return;
		super.disactive();
	}

	public setInternal(value: T) {
		if (this.handleFilterError(value)) {
			return;
		}
		super.setInternal(value);
	}

	public set(value: T) {
		super.set(value);
		this.options.onExternal?.(value);
	}

	protected update(value: T, error?: Error) {
		super.update(value, error);
		this.options.tap?.(value);
	}

	public changeOptions(options: ICellOptions<T, TKey>) {
		if (this.options === options) return;
		this.options = options;
		this.handleFilterError(this.value);
	}

	private handleFilterError(value: T): boolean {
		if (this.options.filter && !this.options.filter(value)) {
			this.setError(new CellFilterError(value, this.options.filter, this));
			return true;
		}
		return false;
	}

	protected compare(value: T): boolean {
		const oldValue = this.value;
		if (Object.is(value, oldValue)) return true;
		if ((!value && oldValue) || (value && !oldValue)) return false;
		if (!this.options.compare) return false;
		if (!this.options.compareKey)
			return this.options.compare(
				value as unknown as TKey,
				oldValue as unknown as TKey,
			);
		return this.options.compare(
			this.options.compareKey(value),
			this.options.compareKey(oldValue),
		);
	}

	protected getSubscriber(value) {
		return this.options.subscribe ?? super.getSubscriber(value);
	}

	public static OnChange<T, TKey>(
		pull: () => T,
		options: ICellOptions<T, TKey>,
		listener: (event: { value: T; oldValue: T }) => void,
	): () => void;
	public static OnChange<T>(
		pull: () => T,
		listener: (event: { value: T; oldValue: T }) => void,
	): () => void;
	public static OnChange<T, TKey>(
		pull: () => T,
		options: ICellOptions<T, TKey> | ((event: { value: T; oldValue: T }) => void),
		listener?: (event: { value: T; oldValue: T }) => void,
	): () => void {
		if (typeof options === 'function') {
			// @ts-ignore
			listener = options;
			// @ts-ignore
			options = {};
		}
		return new Cell(pull, options).on('change', listener);
	}

	public static MergeCells<T>(...pulls: (() => T)[]): Cell<T> {
		const cell = new Cell<T>(null);
		for (const pull of pulls) {
			Cell.OnChange(pull, (x) => cell.set(x.value));
		}
		return cell;
	}

	static from<T>(subscribe: {subscribe: Subscriber<any, T>}): BaseCell<T>;
	static from<TEventName extends string, T, TEventEmitter extends EventEmitter<Record<TEventName, T>>>(eventTarget: TEventEmitter, eventName: TEventName): BaseCell<T>
	static from<TEventName, TEventTarget extends EventTarget>(eventTarget: TEventTarget, eventName: TEventName): BaseCell<
		TEventTarget extends {
			addEventListener(eventName: TEventName, listener: (this: TEventTarget, ev: infer T) => any);
		} ? T : never
	>;
	static from<T>(something, eventName?): BaseCell<T> {
		if (something instanceof EventEmitterBase) {
			return new EventCell<T>({
				subscribe: listener => something.on(eventName, listener)
			});
		}
		if (something instanceof EventTarget){
			return new EventCell<T>({
				subscribe: listener => eventTargetSubscriber(eventName).call(something, listener)
			});
		}
		return new EventCell<T>(something);
	}

	static events<TEventTarget extends EventTarget>(eventTarget: TEventTarget): EventTargetProxy<TEventTarget> {
		if (!eventTarget) return null;
		return new Proxy<EventTargetProxy<TEventTarget>>({} as any, {
			get(target: EventTargetProxy<TEventTarget>, p: string | symbol, receiver: any): any{
				const cell = target[p] ??= Cell.from(eventTarget, p) as any;
				if (cell instanceof BaseCell)
					return cell.get();
				return cell;
			}
		})
	}
}

class EventCell<T> extends BaseCell<T> {
	constructor(private subscriber: {subscribe: Subscriber<any, T>}) {
		super(null);
	}

	unsusbscribe;

	active() {
		this.unsusbscribe = this.subscriber.subscribe((e) => this.set(e));
		super.active();
	}

	protected disactive() {
		super.disactive();
		this.unsusbscribe?.();
		this.value = null;
	}
}

export function eventTargetSubscriber<T extends EventTarget, Args extends Event>(eventName: string): Subscriber<T, Args> {
	return function (this: T, listener: (e: Args) => void) {
		this.addEventListener(eventName, listener);
		return () => this.removeEventListener(eventName, listener);
	}
}


export class CellFilterError<T> extends Error {
	constructor(
		public value: T,
		public filter: (x: T) => void,
		public cell: Cell<T, unknown>,
	) {
		super(`Cell have not accepted value: ${value}`);
	}
}


type RemoveOn<T extends string> = T extends `on${infer S}` ? S : never;
type EventTargetProxy<TEventTarget> = {
	[key in RemoveOn<keyof TEventTarget & string>]: EventType<TEventTarget, key>
}
type EventType<TEventTarget, TKey extends string> = TEventTarget extends {
	[key in `on${TKey}`]: ((this: TEventTarget, ev: infer T) => any) | null;
} ? T : never;