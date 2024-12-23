import {Fn, ResolvablePromise, throttle} from "../helpers";
import * as console from "node:console";
import {EventEmitter} from "../event-emitter";

export {AIEmitter} from "./AIEmitter";
export {AIListener} from "./AIListener";

export class TimerEmitter extends EventEmitter<{
    time: number
}>{
    private index = 0;
    private intervalId: any;
    constructor(private delay: number) {
        super();
    }

    protected subscribe(eventName: keyof { time: number }) {
        super.subscribe(eventName);
        this.intervalId = setInterval(() => this.emit('time', this.index++));
    }

    protected unsubscribe(eventName: keyof { time: number }) {
        super.subscribe(eventName);
        clearInterval(this.intervalId);
    }
}

export function timer(time: number): AsyncIterable<number>{
    const ee = new TimerEmitter(time);
    return ee.iterate('time');
}

export function throttler(time: number): AsyncIterable<void>{
    const emitter = throttle((value: void) => {
        console.log('emit');
    }, time, {
        leading: false,
        trailing: true
    });
    return {
        [Symbol.asyncIterator](): AsyncIterator<void>{
            return {
                async next(...[value]): Promise<IteratorResult<void, any>> {
                    await emitter();
                    return { done: false, value: undefined };
                }
            }
        }
    }
}