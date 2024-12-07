import {EventEmitterBase} from "./eventEmitterBase";
import {removeAll} from "../helpers/Array";
import {DefaultListenerOptions, EventListenerOptions} from "./common";
import {ResolvablePromise} from "../helpers";

export class EventEmitter<TEvents extends {
    [key in string]: any | void;
}> extends EventEmitterBase<TEvents> {

    protected listeners = new Map<keyof TEvents, Array<{
        listener: (data, stop?) => void,
        options: EventListenerOptions
    }>>();

    public on<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void,
                                                options: EventListenerOptions = DefaultListenerOptions) {
        if (!this.listeners.has(eventName)){
            this.listeners.set(eventName, []);
            this.subscribe(eventName);
        }
        const arr = this.listeners.get(eventName);
        arr.push({listener, options: options});
        arr.sort((a, b) => b.options.Priority - a.options.Priority);
        return () => this.off(eventName, listener);
    }

    public off<TEventName extends keyof TEvents>(eventName: TEventName, listener: (data: TEvents[TEventName]) => void) {
        const set = this.listeners.get(eventName) ?? [];
        removeAll(set, x => x.listener === listener);
        if (set.length == 0) {
            this.listeners.delete(eventName);
            this.unsubscribe(eventName);
        }
    }

    protected subscribe(eventName: keyof TEvents) {
    }

    protected unsubscribe(eventName: keyof TEvents) {
    }

    public emit<TEventName extends keyof TEvents>(eventName: TEventName, data?: TEvents[TEventName]) {
        let arr = this.listeners.get(eventName);
        if (!arr)
            return;
        arr.slice().forEach(x => x.listener(data));
    }

    public [Symbol.dispose]() {
        for (let [key, value] of this.listeners) {
            for (let listener of value) {
                this.off(key, listener.listener);
            }
        }
    }

    public iterate<TEventName extends keyof TEvents>(eventName: TEventName): AsyncIterable<TEvents[TEventName]>{
        return {
            [Symbol.asyncIterator]: () => {
                const promiseQueue: Array<ResolvablePromise<IteratorResult<TEvents[TEventName]>>> = [];
                const valueQueue: TEvents[TEventName][] = [];
                const off = this.on(eventName, event => {
                    const promise = promiseQueue.shift();
                    if (promise){
                        promise.resolve({ value: event, done: false });
                    } else {
                        valueQueue.push(event);
                    }
                });
                return {
                    next(){
                        const value = valueQueue.shift();
                        if (value){
                            return Promise.resolve({ value, done: false });
                        } else {
                            const promise = new ResolvablePromise<IteratorResult<TEvents[TEventName]>>();
                            promiseQueue.push(promise);
                            return promise.asPromise();
                        }
                    },
                    return(value?: any): Promise<IteratorResult<TEvents[TEventName], any>> {
                        off();
                        promiseQueue.forEach(q => q.resolve({
                            done: true,
                            value
                        }))
                        return Promise.resolve({
                            done: true,
                            value: null
                        });
                    },
                    throw(e?: any): Promise<IteratorResult<TEvents[TEventName], any>> {
                        off();
                        return Promise.reject(e);
                    }
                }
            }
        }
    }
}