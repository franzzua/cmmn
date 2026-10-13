import { expect, suite, test } from '@cmmn/tools/test';
import { Cell } from '../../cell/cell.ts';

const noop = () => {};

@suite
class NotActiveSpec {
	@test
	getActual() {
		const a = new Cell(7);
		const b = new Cell(() => a.get());
		expect(b.get()).toEqual(a.get());
		a.set(9);
		expect(b.get()).toEqual(a.get());
	}
}
