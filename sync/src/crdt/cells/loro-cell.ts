import {BaseCell, Cell, EventEmitter, ICellOptions} from "@cmmn/core";
import {CounterDiff, Diff, LoroCounter, LoroDoc, LoroList, MovableListOp, ListDiff} from "loro-crdt";
import {IMovableList, updateMovableList} from "../update-movable-list";
import {LoroDocCell} from "./loro-doc-cell";

export class LoroCell<T> extends BaseCell<T> {
	private constructor(private docCell: LoroDocCell,
	                    private id: string,
	                    private getValue: () => T,
	                    private setValue: (value: T) => void) {
		super(getValue());
	}

	private get doc() {
		return this.docCell.doc;
	}

	public get isSynced() {
		return this.docCell.isSynced;
	}

	subscription;

	active() {
		super.active();
		this.subscription = this.doc.subscribe(e => {
			for (let event of e.events) {
				if (event.path[0] != this.id) continue;
				this.set(this.getValue());
				this.extender.changes.emit('diff', event.diff);
			}
		})
	}

	protected disactive() {
		super.disactive();
		this.subscription?.();
	}

	private extender = {
		self: this,
		changes: new EventEmitter<{diff: Diff}>(),
		get isSynced() {
			return this.self.isSynced;
		},
		commit() {
			this.self.doc.commit();
		},
		get value() {
			return this.self.get()
		},
		set value(value) {
			this.self.setValue(value)
			this.commit();
		}
	}

	extend(item) {
		return Object.create(item, Object.getOwnPropertyDescriptors(this.extender));
	}

	static Counter(docCell: LoroDocCell, id: string): LoroCounterCell {
		const counter = docCell.doc.getCounter(id);
		const cell = new LoroCell<number, CounterDiff>(docCell, id,
			() => counter.value,
			value => {
				if (value > counter.value) {
					counter.increment(value - counter.value);
				} else {
					counter.decrement(value - counter.value);
				}
			});
		return cell.extend(counter)
	}

	static List<T>(docCell: LoroDocCell, id: string): LoroListCell<T> {
		const list = docCell.doc.getMovableList(id);
		const cell = new LoroCell<T[]>(docCell, id,
			() => list.toArray() as T[],
			value => updateMovableList<unknown>(list as IMovableList<unknown>, value));
		return cell.extend(list);
	}
}

export type LoroCounterCell = Omit<LoroCounter, "value"> & {
	commit();
	changes: EventEmitter<{diff: CounterDiff}>;
	value: number;
	readonly isSynced: boolean;
}
export type LoroListCell<T> = LoroList & {
	commit();
	changes: EventEmitter<{diff: ListDiff}>;
	value: T[];
	readonly isSynced: boolean;
}