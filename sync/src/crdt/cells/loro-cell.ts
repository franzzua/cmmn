import {BaseCell, Cell, EventEmitter, ICellOptions} from "@cmmn/core";
import {CounterDiff, Diff, LoroCounter, LoroDoc, LoroList, MovableListOp, ListDiff} from "loro-crdt";
import {IMovableList, updateMovableList} from "../update-movable-list";
import {LoroDocCell} from "./loro-doc-cell";
import {LoroShape} from "./types";

export abstract class LoroCell<T, TDiff extends Diff> extends BaseCell<T> {
	protected constructor(private docCell: LoroDocCell,
	                    private id: string,
	                    private getValue: () => T) {
		super(getValue());
	}

	private get doc() {
		return this.docCell.doc;
	}

	public get isSynced() {
		return this.docCell.isSynced;
	}

	subscription;
	changes = new EventEmitter<{
		diff: TDiff
	}>()
	active() {
		super.active();
		this.subscription = this.doc.subscribe(e => {
			for (let event of e.events) {
				if (event.path[0] != this.id) continue;
				this.set(this.getValue());
				this.changes.emit('diff', event.diff);
			}
		})
	}

	protected disactive() {
		super.disactive();
		this.subscription?.();
	}

	protected get extender() {
		const self = this;
		return {
			changes: self.changes,
			get isSynced() {
				return self.isSynced;
			},
			commit() {
				self.doc.commit();
			},
			get value() {
				return self.get()
			},
			set value(value) {
				self.setValue(value)
				this.commit();
			}
		}
	}

	abstract setValue(value: T);

	extend(item) {
		return Object.create(item, Object.getOwnPropertyDescriptors(this.extender));
	}

}