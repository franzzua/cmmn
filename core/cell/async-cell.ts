import {Cell, type ICellOptions} from './cell';
import {BaseCell} from './base-cell';
import {cell, getOrCreateCell} from "./decorators";
import {resolve} from "../di";
import type {AccessorDecoratorResult, FieldDecoratorResult} from "../di/types";

export type IAsyncCellOptions<T, TKey = T> = ICellOptions<AsyncResult<T>, TKey> & {
	// throttle?: { time: number, leading: boolean, trailing: boolean }
};

export class AsyncCell<T, TKey = T> extends Cell<AsyncResult<T>, TKey> {
	constructor(
		generator: () => AsyncGenerator<T> | Promise<T>,
		protected options: IAsyncCellOptions<T, TKey> = {},
		/** @internal **/
		private genCell = new BaseCell(generator)
	) {
		super({
			isPending: true
		}, options);
	}

	private onChange = async (gen: { value: AsyncGenerator<T> | Promise<T> }) => {
		if (!gen.value) return this.set(null);
		if (Symbol.asyncIterator in gen.value)
			for await (const value of gen.value as AsyncGenerator<T>) {
				// prevent race
				if (this.genCell.get() !== gen.value) {
					return;
				}
				this.set({ result: value });
			}
		else {
			const value = await (gen.value as Promise<T>);
			if (this.genCell.get() !== gen.value) {
				return;
			}
			this.set({ result: value });
		}
	};

	active() {
		this.genCell.on('change', this.onChange);
		this.onChange({value: this.genCell.get()});
		super.active();
	}

	disactive() {
		if (this.options.activeWith)
			return;
		this.genCell[Symbol.dispose]();
		super.disactive();
	}

	static sync<T>(p: Promise<T>): T {
		return p as T;
	}

	static query<T>(getter: () => (Promise<T> | AsyncGenerator<T>),
	                options: IAsyncCellOptions<T> = {}): AsyncResult<T>{
		const cell = new AsyncCell(getter, options);
		return new AsyncResultWrapper(cell);
	}
}
export type AsyncResult<T> =
	| { isPending: true; result?: never; error?: never; }
	| { isPending?: never; result: T; error?: never; }
	| { isPending?: never; result?: never; error: Error; }

class AsyncResultWrapper<T> implements AsyncResult<T> {
	constructor(private cell: AsyncCell<T>) {
	}

	public get result(): T {
		return this.cell.get().result;
	}

	public get isPending(){
		return this.cell.get().isPending;
	}

	public get error(){
		return this.cell.get().error;
	}
}

