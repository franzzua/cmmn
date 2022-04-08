import {expect, sinon, suite, test} from "@cmmn/tools/test";
import {BaseCell} from '../src/baseCell';
import {Actualizator} from "../src/actualizator";

@suite
class ChangeSpec {

    @test
    changeEvent() {
        const a = new BaseCell(0);
        a.on('change', x => {
            expect(x.value).toBe(1);
            expect(x.oldValue).toBe(0);
        })
        a.set(1);
    }

    @test
    async changeEvent2() {
        const a = new BaseCell(0);
        const b = new BaseCell(() => a.get() + 1);
        const onChange = sinon.spy(x => {
            expect(x.value).toBe(2);
            expect(x.oldValue).toBe(1);
        });
        b.on('change', onChange)
        a.set(1);
        await Actualizator.wait;
        expect(onChange.calledOnce).toBeTruthy();
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