import {test, mock, describe} from "node:test";
import {Fn} from "../helpers";
import {expect} from "@cmmn/tools/test";
import {AIListener, AIEmitter} from "../ai";
import {EventEmitter} from "../event-emitter";
import {pipe} from "../helpers";

describe('ai', (ctx) => {
    test('eventEmitter', async () => {
        const abort = new AbortController();
        const emitter = new EventEmitter<{
            value: number;
        }>();
        const mockFn = mock.fn();
        const p = (async () => {
            for await (let ee of emitter.iterate('value', {
                signal: abort.signal
            })) {
                mockFn(ee);
            }
        })();
        const p2 = (async () => {
            emitter.emit('value', 1);
            await Fn.asyncDelay(10);
            emitter.emit('value', 2);
            await Fn.asyncDelay(10);
            emitter.emit('value', 3);
            await Fn.asyncDelay(10);
            emitter[Symbol.dispose]();
        })();
        await p;
        expect(mockFn.mock.callCount()).toEqual(3);
        expect(mockFn.mock.calls[0].arguments[0]).toEqual(1);
        expect(mockFn.mock.calls[1].arguments[0]).toEqual(2);
        expect(mockFn.mock.calls[2].arguments[0]).toEqual(3);
    })
    test('emitter', async () => {
        const emitter = new AIEmitter<number>();
        const mockFn = mock.fn();
        const p = (async () => {
            for await (let ee of emitter) {
                mockFn(ee);
            }
        })();
        const p2 = (async () => {
            emitter.emit(1);
            await Fn.asyncDelay(10);
            emitter.emit(2);
            await Fn.asyncDelay(10);
            emitter.emit(3);
            await Fn.asyncDelay(10);
            emitter[Symbol.dispose]();
        })();
        await p;
        expect(mockFn.mock.callCount()).toEqual(3);
        expect(mockFn.mock.calls[0].arguments[0]).toEqual(1);
        expect(mockFn.mock.calls[1].arguments[0]).toEqual(2);
        expect(mockFn.mock.calls[2].arguments[0]).toEqual(3);
    });

    test('listener', async () => {
        async function* ai() {
            await Fn.asyncDelay(60);
            yield 1;
            await Fn.asyncDelay(70);
            yield 2;
            await Fn.asyncDelay(110);
            yield 3;
        }

        const listener = new AIListener(ai());
        const mockFn = mock.fn();
        listener.on('value', mockFn);
        await listener.awaiter;
        expect(mockFn.mock.callCount()).toEqual(3);
        expect(mockFn.mock.calls[0].arguments[0]).toEqual(1);
        expect(mockFn.mock.calls[1].arguments[0]).toEqual(2);
        expect(mockFn.mock.calls[2].arguments[0]).toEqual(3);
    });

})
