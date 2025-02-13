import { expect, suite, mock, test } from '@cmmn/tools/test';
import { BaseCell } from '../../cell/base-cell.js';
import { Graph } from '../../cell/graph';

@suite
class ChangeSpec {
	@test
	changeEvent() {
		const a = new BaseCell(0);
		a.on('change', (x) => {
			expect(x.value).toEqual(1);
			expect(x.oldValue).toEqual(0);
		});
		a.set(1);
	}

	@test
	async changeEvent2() {
		const a = new BaseCell(0);
		const b = new BaseCell(() => a.get() + 1);
		const onChange = mock.fn((x) => {
			expect(x.value).toEqual(2);
			expect(x.oldValue).toEqual(1);
		});
		b.on('change', onChange);
		a.set(1);
		await Graph.wait;
		expect(onChange.mock.callCount() == 1).toBeTruthy();
	}

	@test
	async changeEvent3() {
		const a = new BaseCell(0);
		const getB = mock.fn(() => a.get() + 1);
		const b = new BaseCell(getB);
		const onChange = (x) => {};
		b.on('change', onChange);
		getB.mock.resetCalls(); // !
		a.set(1);
		await Graph.wait;
		expect(getB.mock.callCount()).toEqual(1);
	}

	@test
	distinctChange() {
		let onChange = mock.fn();
		let a = new BaseCell(1);
		a.on('change', onChange);
		a.set(1);
		expect(onChange.mock.callCount() == 0).toBeTruthy();
	}
}
