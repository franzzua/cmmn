import {BaseCell, Cell, getOrAdd, scoped} from "@cmmn/core";

@scoped()
export class Props<TProps> {
	#cells = new Map<string | symbol, Cell>();

	set(props) {
		for (let key in props) {
			getOrAdd(this.#cells, key, (key) => {
				const cell = new BaseCell(undefined);
				Object.defineProperty(this, key, {
					get(): any {
						return cell.get();
					},
					set(value) {
						cell.set(value);
					},
					enumerable: true
				})
				return cell;
			}).set(props[key]);
		}
	}

	[Symbol.dispose]() {
		for (let value of this.#cells.values()) {
			value[Symbol.dispose]();
		}
		this.#cells.clear();
	}
}