import { expect, mock, suite, test } from '@cmmn/tools/test';
import { Cell } from '../../cell';
import {cell} from "../../cell/decorators";

class TestObject {
	@cell()
	public accessor Value = 1;

	@cell()
	public get Computed(): number {
		return this.Value + 1;
	}

	@cell()
	public set Computed(x) {}
}

@suite
class DecoratorsSpec {
	@test
	async writeCell() {
		const a = new TestObject();
		const b = new Cell(() => a.Value);
		const onChange = mock.fn();
		b.on('change', onChange);
		a.Value = 2;
		await Promise.resolve();
		expect(onChange.mock.callCount()).toEqual(1);
		expect(b.get()).toEqual(2);
	}

	@test
	async computed() {
		const a = new TestObject();
		const b = new Cell(() => a.Computed);
		const onChange = mock.fn();
		b.on('change', onChange);
		a.Value = 2;
		await Promise.resolve();
		expect(onChange.mock.callCount()).toEqual(1);
		expect(b.get()).toEqual(3);
	}

	@test
	async computedSet() {
		const a = new TestObject();
		a.Computed = 4;
		expect(a.Computed).toEqual(4);
	}
}
