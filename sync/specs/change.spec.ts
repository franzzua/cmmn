import {expect, suite, mock, test} from "@cmmn/tools/test";
import {pipe} from '../src/pipe/pipe';
import {BaseCell, Fn} from "@cmmn/core";
import {map} from "../src/pipe/map";
import {SinkCell} from "../src/pipe/sinkCell";

@suite
class ChangeSpec{

    @test
    async changeEvent() {
        const source = new BaseCell(0);

        const target = new SinkCell(pipe(source,
            map(e => e.value),
            map(x => x + 1),
            map(y => y.toString() + "a"),
            map(z => z + z)
        ));
        const listener = mock.fn();
        target.on('change', listener);
        source.set(2);
        await Fn.asyncDelay(0);
        expect(listener.mock.callCount()).toEqual(1);
        expect(listener.mock.calls[0].arguments[0].value).toEqual("3a3a");
    }


}
