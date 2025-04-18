import { compare, type DeepPartial, Fn } from '../../helpers';
import { EventEmitter } from '../../event-emitter';
import { BaseCell } from '../base-cell';
import { ObservableMap } from './ObservableMap';

@BaseCell.like()
export class ObservableObject<T> extends EventEmitter<{
	change: { oldValue: T; value: T; keys?: Array<string> };
}> {
	constructor(private value: Readonly<T>) {
		super();
	}

	public get Value() {
		return this.value;
	}

	public Set(value: T) {
		this.emit('change', {
			oldValue: this.value,
			value,
			keys: Object.keys(value),
		});
		this.value = value;
	}

	public Diff(diff: DeepPartial<T>) {
		const oldValue = this.value;
		const keys = Object.keys(diff).filter(
			(x) => !compare(diff[x], oldValue[x]),
		);
		if (keys.length === 0) return;
		const value = Fn.deepAssign(this.value, diff);
		this.emit('change', {
			oldValue,
			value,
			keys,
		});
	}
}
