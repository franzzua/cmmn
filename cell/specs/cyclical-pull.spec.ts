import {expect, suite, test} from '@cmmn/tools/test';
import {cell} from '../src/decorators.js';
import {Cell} from '../src/cell.js';
import {compare} from '@cmmn/core';

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
        Cell.OnChange(() => check.b, () => {});
        Throw(() => check.b, 'cyclical pull');
    }

    @test
    classFields2() {
        class Check {
            $state = new Cell(() => this.State);

            get State() {
                return this.$state.get();
            }
        }
        const check = new Check();
        check.$state.on('change', () => {});
        Throw(() => check.$state.get(), 'cyclical pull');
        Throw(() => check.State, 'cyclical pull');
    }

    @test
    classFields3() {
        class Check {
            $state = new Cell(() => this.State, {
                compare,
            });

            get State() {
                return this.$state.get();
            }
        }

        const check = new Check();
        check.$state.on('change', () => {});
        Throw(() => check.$state.get(), 'cyclical pull');
        Throw(() => check.State, 'cyclical pull');
    }

    @test
    justCell1() {
        const a = new Cell(1);
        const b = new Cell(() => a.get() + b.get());
        b.active();
        Throw(() => b.get(), 'cyclical pull');
    }

    @test
    justCell2() {
        const a = new Cell(() => b.get());
        const b = new Cell(() => a.get());
        b.active();
        Throw(() => b.get(), 'cyclical pull');
    }

    @test
    justCell3() {
        const a = new Cell(() => c.get());
        const b = new Cell(() => a.get());
        const c = new Cell(() => b.get());
        c.active();
        Throw(() => b.get(), 'cyclical pull');
    }

}
