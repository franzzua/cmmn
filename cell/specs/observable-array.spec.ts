import {expect, sinon, suite, test} from "@cmmn/tools/test";
import {ObservableArray} from "../src/ObservableArray";

@suite
class ObservableArraySpec {

    @test
    iterable() {
        const a = new ObservableArray<number>([1]);
        for (let x of a) {
            expect(x).toEqual(1);
        }
    }
    @test
    changeEvent() {
        const a = new ObservableArray<number>();
        const onChange = sinon.spy(x => {
            expect([...x.value]).toEqual([1,2,3]);
        })
        a.on('change', onChange);
        a.push(1,2,3);
        expect(onChange.calledOnce).toBeTruthy();
    }

    @test
    values() {
        const a = new ObservableArray<number>([1]);
        expect([...a.values()]).toEqual([]);
    }

}
