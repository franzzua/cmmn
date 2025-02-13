import { expect, mock, suite, test } from '@cmmn/tools/test';
import { Cell } from '../../cell/cell.js';
import { Graph } from '../../cell/graph';

@suite
export class FilterSpec {
	@test
	failReadForbidden() {
		const cell = new Cell(0, {
			filter: (x) => x > 5,
		});
		expect(cell.get.bind(cell)).toThrow();
	}

	@test
	async notChangeIfForbidden() {
		const cell = new Cell(5, {
			filter: (x) => x > 5,
		});
		const onChange = mock.fn();
		cell.on('change', onChange);
		cell.set(6);
		await Graph.wait;
		expect(onChange.mock.callCount()).toEqual(1);
		cell.set(3);
		await Graph.wait;
		expect(onChange.mock.callCount()).toEqual(1);
	}
}
