import {expect, suite, test} from '@cmmn/tools/test';
import {cell} from '../src/decorators';
import {Cell} from '../src/cell';

function Throw(fn: Function, message: string) {
    try {
        fn();
    } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(err).toHaveProperty('message', message);
        return;
    }
    expect('unreachable code section').toBe('but it came to this anyway');
}


@suite
class CyclicalPullSpec {
    @test
    classFields() {
        class Check {
            @cell a = 1;

            @cell get b() {
                return this.a + this.b;
            }
        }

        const check = new Check();
        Throw(() => check.b, 'cyclical pull');
    }

    @test
    justCell1() {
        const a = new Cell(1);
        const b = new Cell(() => a.get() + b.get());
        Throw(() => b.get(), 'cyclical pull');
    }

    @test
    justCell2() {
        const a = new Cell(() => b.get());
        const b = new Cell(() => a.get());
        Throw(() => b.get(), 'cyclical pull');
    }

    @test
    justCell3() {
        const a = new Cell(() => c.get());
        const b = new Cell(() => a.get());
        const c = new Cell(() => b.get());
        Throw(() => b.get(), 'cyclical pull');
    }

}
