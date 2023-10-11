import {expect, suite, test} from "@cmmn/tools/test";
import {BaseCell} from '../src/baseCell.js';

@suite
class WriteSpec {

    @test
    write() {
        const a = new BaseCell(0);
        a.set(3);
        expect(a.get()).toEqual(3);
    }

    @test
    writeWithDeps() {
        const a = new BaseCell(0);
        const b = new BaseCell(() => a.get() + 1);
        a.set(3);
        expect(b.get()).toEqual(4);
    }

    @test
    writeComputed() {
        let a = new BaseCell(1);
        let b = new BaseCell<number>(() => a.get() + 1);
        let c = new BaseCell(() => b.get() + 1);
        c.on('change', () => {});

        a.set(2);
        b.set(4);

        expect(c.get()).toEqual(5);

    }
    @test
    writeComputedAndPushAfter() {
        let a = new BaseCell(1);
        let b = new BaseCell<number>(() => a.get() + 1);
        let c = new BaseCell(() => b.get() + 1);
        c.on('change', () => {});

        b.set(4);
        a.set(2);

        expect(c.get()).toEqual(4);

    }

    @test
    writeInPull(){
        const a = new BaseCell(1);
        const b = new BaseCell(() => {
            if (a.get() == 2)
                a.set(3);
            return a.get() + 1;
        });
        a.set(2);
        expect(b.get()).toEqual(4);
    }

}