import { EventEmitter } from '../../event-emitter';
import { BaseCell } from '../base-cell';
import { ObservableSet } from './ObservableSet';

export class ObservableMap<K, V> extends Map<K, V> {
	private ee = new EventEmitter<{
		change:
			| {
					oldValue: V;
					value: V;
					key: K;
					type: 'add' | 'delete' | 'update';
			  }
			| { value: Map<K, V> };
	}>();
	public on = this.ee.on.bind(this.ee);
	public off = this.ee.off.bind(this.ee);

	toArray(): ReadonlyArray<V> {
		return Array.from(this.values());
	}

	set(key: K, value: V): this {
		const old = this.get(key);
		const has = this.has(key);
		super.set(key, value);
		this.emitChange({
			oldValue: old,
			value,
			key,
			type: has ? 'update' : 'add',
		});
		return this;
	}

	delete(key: K): boolean {
		const has = this.has(key);
		if (!has) return false;
		const old = this.get(key);
		super.delete(key);
		this.emitChange({ oldValue: old, value: undefined, key, type: 'delete' });
		return true;
	}

	mergeFrom<U>(
		map: Map<K, U>,
		create: (value: U) => V,
		update?: (item: V, value: U) => void,
		onDelete?: (item: V) => void,
	) {
		for (const [existed, value] of this.entries()) {
			if (!map.has(existed)) {
				this.delete(existed);
				onDelete?.(value);
			}
		}
		for (const [key, value] of map.entries()) {
			if (this.has(key)) update?.(this.get(key), value);
			else this.set(key, create(value));
		}
		this.ee.emit('change', {
			value: this,
		});
	}

	emitChange(data) {
		this.ee.emit('change', data);
	}
}

BaseCell.likeCells.add(ObservableMap);
