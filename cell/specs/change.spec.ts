import {expect, sinon, suite, test} from "@cmmn/tools/test";
import {BaseCell} from '../src/baseCell.js';
import {Actualizator} from "../src/actualizator";

@suite
class ChangeSpec {

    @test
    changeEvent() {
        const a = new BaseCell(0);
        a.on('change', x => {
            expect(x.value).toEqual(1);
            expect(x.oldValue).toEqual(0);
        })
        a.set(1);
    }

    @test
    async changeEvent2() {
        const a = new BaseCell(0);
        const b = new BaseCell(() => a.get() + 1);
        const onChange = sinon.spy(x => {
            expect(x.value).toEqual(2);
            expect(x.oldValue).toEqual(1);
        });
        b.on('change', onChange)
        a.set(1);
        await Actualizator.wait;
        expect(onChange.calledOnce).toBeTruthy();
    }

    @test
    async changeEvent3() {
        const a = new BaseCell(0);
        const getB = sinon.spy(() => a.get() + 1);
        const b = new BaseCell(getB);
        const onChange = x => {};
        b.on('change', onChange)
        getB.resetHistory(); // !
        a.set(1);
        await Actualizator.wait;
        expect(getB.callCount).toEqual(1);
    }

    @test
    distinctChange() {
        let onChange = sinon.spy();
        let a = new BaseCell(1);
        a.on('change', onChange)
        a.set(1);
        expect(onChange.notCalled).toBeTruthy();
    }

}
