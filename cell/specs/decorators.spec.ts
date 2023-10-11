import {expect, sinon, suite, test} from "@cmmn/tools/test";
import {cell} from "../src/decorators.js";
import {Cell} from "../src/cell.js";

class TestObject {
    @cell
    public Value = 1;

    @cell({filter: x => !!x})
    public NotNull = null;

    @cell
    public get Computed(): number {
        return this.Value + 1;
    }

    public set Computed(x) {
    }

    @cell
    public getComputed() {
        return this.Computed * this.NotNull;
    }
}

@suite
class DecoratorsSpec {
    @test
    async writeCell() {
        const a = new TestObject();
        const b = new Cell(() => a.Value);
        const onChange = sinon.spy();
        b.on('change', onChange);
        a.Value = 2;
        await Promise.resolve();
        expect(onChange.callCount).toEqual(1);
        expect(b.get()).toEqual(2);
    }

    @test
    readNotNullCell() {
        const a = new TestObject();
        expect(() => a.NotNull).toThrow()
    }

    @test
    async computed() {
        const a = new TestObject();
        const b = new Cell(() => a.Computed);
        const onChange = sinon.spy();
        b.on('change', onChange);
        a.Value = 2;
        await Promise.resolve();
        expect(onChange.callCount).toEqual(1);
        expect(b.get()).toEqual(3);
    }

    @test
    async computedSet() {
        const a = new TestObject();
        a.Computed = 4;
        expect(a.Computed).toEqual(4);
    }

    @test
    async computedMethod() {
        const a = new TestObject();
        a.Value = 4;
        a.NotNull = 3;
        expect(a.getComputed()).toEqual(15);
    }
}