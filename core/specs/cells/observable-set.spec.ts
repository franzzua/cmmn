import { expect, mock, suite, test } from '@cmmn/tools/test';
import { ObservableSet } from '../../cell';

@suite
class ObservableSetSpec {
	@test
	iterable() {
		const a = new ObservableSet<number>([1]);
		for (const x of a) {
			expect(x).toEqual(1);
		}
	}
	@test
	changeEvent() {
		const a = new ObservableSet<number>();
		const onChange = mock.fn((x) => {
			expect([...x.value]).toEqual([1]);
		});
		a.on('change', onChange);
		a.add(1);
		expect(onChange.mock.callCount()).toEqual(1);
	}

	@test
	values() {
		const a = new ObservableSet<number>([1]);
		expect([...a.values()]).toEqual([1]);
	}

	@test
	toStr() {
		const a = new ObservableSet<number>([1, 2]);
		expect(Object.prototype.toString.call(a)).toEqual('[object Set]');
		expect(a.toString()).toEqual('(1,2)');
	}
}
