import {expect, suite, mock, test} from "@cmmn/tools/test";
import {OperatorChain, pipe, sink} from '../src/pipe/pipe';
import {BaseCell, Fn} from "@cmmn/core";
import {map} from "../src/pipe/map";
import * as console from "node:console";

@suite
class ChangeSpec{


    @test
    async changeEvent() {
        const source = new BaseCell(0);

        const chain: OperatorChain<[{
            oldValue: number;
            value: number;
        }, number, number, string, string]> = [
            map(e => {
                console.log('e', e);
                return e.value;
            }),
            map(x => x + 1),
            map(y => y.toString() + ""),
            map(z => z + z)
        ];

        const target = sink(pipe(source.iterate('change'), chain));
        const listener = mock.fn();
        target.on('change', listener);
        source.set(2);
        await Fn.asyncDelay(100);
        expect(listener.mock.callCount()).toEqual(1);
        expect(listener.mock.calls[0].arguments[0].value).toEqual("33");
    }


}
