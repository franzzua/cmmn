import { EventEmitter, EventEmitterBase } from '../event-emitter';
import { Graph } from './graph';
import { type Selector, selector } from './cell-selector';

export class BaseCell<T = unknown>
	extends EventEmitter<{
		change: { value: T; oldValue: T };
		error: Error;
	}>
{
	/** @internal **/
	pull: () => T;
	value: T;
	error: Error;
	dependencies: Set<BaseCell>; // cells on which this cell depends
	private reactions: Set<BaseCell>; // cells dependent on this cell
	isPulling = false;
	isActive = false;
	isActual: boolean;
	// debug = getDebugName(/BaseCell|Cell/);

	constructor(value: T | (() => T)) {
		super();
		if (typeof value === 'function') {
			this.pull = value as () => T;
			this.isActual = false;
		} else {
			this.value = value;
			this.isActual = true;
		}
	}

	public get(): T {
		if (this.isPulling) {
			throw new CyclicalPullError(this);
		}
		Graph.imCalled(this);
		if (this.isActive && !this.isActual) {
			Graph.Down(this);
		}
		if (this.isActual) {
			if (this.error) throw this.error;
			return this.value;
		}
		return this.pull();
	}

	/** @internal **/
	public setInternal(value: T) {
		if (this.compare(value)) return;
		this.update(value);
	}

	public set(value: T) {
		this.setInternal(value);
		this.isActual = true;
	}

	protected onValueContentChanged = () => {
		this.update(this.value); // e.g. adding a new element to ObservableMap
	};

	public setError(error: Error) {
		this.update(undefined, error);
	}

	/**
	 * Called when only one of the changes has occurred:
	 *  - cell value changed;
	 *  - OR the content of the cell value has changed;
	 *  - OR an error has occurred.
	 */
	protected update(value: T, error?: Error) {
		this.error = error;
		const oldValue = this.value;
		this.value = value;
		if (this.isActive) {
			this.isActual = true;
		}
		if (error) this.emit('error', error);
		else this.notifyChange(value, oldValue);
		if (this.reactions) {
			for (const reaction of this.reactions) {
				reaction.isActual = false;
				Graph.Up(reaction);
			}
		}
	}

	protected compare(value: T) {
		return Object.is(value, this.value);
	}

	protected notifyChange(value: T, oldValue: T) {
		this.emit('change', { value, oldValue });
		if (this.isActive && value !== oldValue) {
			this.unsubscriber?.();
			this.unsubscriber = this.subscribeValue(value);
		}
	}

	active() {
		this.isActive = true;
		this.unsubscriber = this.subscribeValue(this.value);
	}

	protected unsubscriber?: () => void;

	protected disactive() {
		this.isActive = false;
		this.unsubscriber?.();
		if (this.dependencies) {
			for (const dependency of this.dependencies) {
				dependency.removeReaction(this);
			}
			this.dependencies = null;
		}
		if (this.pull) {
			this.isActual = false;
		}
	}

	protected subscribe(eventName: keyof { change: T }) {
		if (eventName === 'change' && !this.isActive) {
			this.active();
			Graph.Down(this);
		}
	}

	protected unsubscribe(eventName: keyof { change: T }) {
		if (eventName === 'change' && this.isActive && !this.reactions)
			this.disactive();
	}

	addDependency(cell: BaseCell) {
		this.dependencies ??= new Set();
		this.dependencies.add(cell);
	}

	addReaction(cell: BaseCell) {
		this.reactions ??= new Set();
		this.reactions.add(cell);
		if (!this.isActive && cell.isActive) this.active();
	}

	removeReaction(cell: BaseCell) {
		if (!this.reactions) return;
		this.reactions.delete(cell);
		if (!this.reactions.size) {
			this.reactions = null;
			if (this.isActive && !this.listeners.get('change')?.length)
				this.disactive();
		}
	}

	get $(): Selector<T> {
		return selector(this);
	}

	/** @internal **/
	// register classes as cell like, so unknown "change" event will notify wrapped cell
	public static likeCells = new Map<unknown, Subscriber<unknown>>();
	private static isLikeCell(
		target,
	): target is EventEmitterBase<{ change: unknown }> {
		for (const likeCell of BaseCell.likeCells) {
			if (target instanceof likeCell) return true;
		}
		return false;
	}

	/* @__PURE__ */
	static like<
		TClass extends abstract new (
			...args: unknown[]
		) => {
			on(key: 'change', listener: () => void): () => void;
		},
	>() {
		return (target: TClass, context: ClassDecoratorContext) => {
			BaseCell.addAdapter(target, function (listener){
				return this.on('change', listener);
			});
		};
	}

	public static readonly Symbol: unique symbol = Symbol('BaseCell');

	static addAdapter<T>(target: new (...args: unknown[]) => T,
	                     subscriber: Subscriber<T>
 ) {
		BaseCell.likeCells.set(target, subscriber);
	}

	protected getSubscriber(value: T): Subscriber<T> {
		if (!value || !value.constructor) return;
		return BaseCell.likeCells.get(value.constructor) ?? this.getSubscriber(value.__proto__)
	}

	private subscribeValue(value: T): () => void {
		const subscriber = this.getSubscriber(value);
		if (subscriber)
			return subscriber.call(value, this.onValueContentChanged);
	}
}

export class CyclicalPullError extends Error {
	constructor(public cell: BaseCell) {
		super('cyclical pull');
	}
}

BaseCell.like()(EventEmitterBase);
export type Subscriber<T> = (this: T, listener: () => void) => (() => void);