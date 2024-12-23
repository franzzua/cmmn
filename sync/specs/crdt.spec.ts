import {expect, suite, mock, test} from "@cmmn/tools/test";
import {Fn} from "@cmmn/core";
import {TextLoroCell} from "../src/crdt/crdt-sink";


@suite
class CrdtSpec{

    @test
    async text() {
        const source = new TextLoroCell();
        source.text.insert(0, 'Hello');
        source.text.insert(5, ' world!');
        source.doc.commit();
        expect(source.get()).toEqual('Hello world!');
        const onChange = mock.fn();
        source.text.delete(11, 1);
        source.on('change', onChange);
        source.doc.commit();
        await Fn.asyncDelay(0);
        expect(onChange.mock.callCount()).toEqual(1);
        expect(source.get()).toEqual('Hello world')
    }


    @test
    async sync() {
        const source = new TextLoroCell();
        const target = new TextLoroCell();

        const promise1 = target.sinkFrom(source.getUpdates());

        source.text.insert(0, 'Hello');
        source.text.insert(5, ' world!');
        source.doc.commit();
        await Fn.asyncDelay(0);
        expect(target.get()).toEqual('Hello world!');
        source.text.delete(11, 1);
        source.doc.commit();
        await Fn.asyncDelay(0);
        expect(target.get()).toEqual('Hello world');
        source[Symbol.dispose]();
        // await Fn.asyncDelay(0);
        await promise1;
    }


}
