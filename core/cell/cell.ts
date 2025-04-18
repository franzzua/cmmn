import { BaseCell } from './base-cell';
import {Fn} from "../helpers";

export type ICellOptions<T, TKey = T> = {
	compare?: (a: TKey, b: TKey) => boolean;
	compareKey?: (value: T) => TKey;
	filter?: (a: T) => boolean;
	tap?: (a: T) => void;
	onExternal?: (a: T) => void;
	startValue?: T;
	// when cell activates it will be active till this disposable lives
	activeWith?: Disposable
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
		if (options.activeWith){
			const dispose = () => {
				options.activeWith = null;
				this.disactive();
			}
			options.activeWith[Symbol.dispose] = options.activeWith[Symbol.dispose]  ? Fn.pipe(
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

	static fromAI<T>(ai: AsyncIterator<T>, options: ICellOptions<T> = {}): Cell<T> {
		return new AICell(ai, options);
	}
}

export class AICell<T> extends Cell<T> {
	constructor(private ai: AsyncIterator<T>, options: ICellOptions<T> = {}) {
		super(undefined, options);
	}

	async active() {
		super.active();
		for await (let t of this.ai) {
			if (!this.isActive) return;
			this.set(t);
		}
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
