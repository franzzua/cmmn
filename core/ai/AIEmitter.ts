import {ResolvablePromise} from "../helpers";
import * as console from "node:console";

export class AIEmitter<T> implements AsyncIterable<T>, Disposable {

    private readonly promiseQueue: Array<ResolvablePromise<IteratorResult<T>>> = [];
    private readonly valueQueue: IteratorResult<T>[] = [];

    public emit = (value: T) => {
        const promise = this.promiseQueue.shift();
        if (promise) {
            promise.resolve({value, done: false});
        } else {
            this.valueQueue.push({value, done: false});
        }
    };

    [Symbol.asyncIterator](): AsyncIterator<T> {
        return {
            next: (): Promise<IteratorResult<T>> => {
                const value = this.valueQueue.shift();
                if (value) {
                    return Promise.resolve(value);
                } else {
                    const promise = new ResolvablePromise<IteratorResult<T>>();
                    this.promiseQueue.push(promise);
                    return promise;
                }
            },
            return: (value?: any): Promise<IteratorResult<T>> => {
                const result = {
                    done: true, value
                }
                this.promiseQueue.forEach(q => q.resolve(result))
                this.promiseQueue.length = 0;
                return Promise.resolve(result);
            },
            throw: (e?: any): Promise<IteratorResult<T>> => {
                this.promiseQueue.forEach(q => q.reject(e))
                this.promiseQueue.length = 0;
                return Promise.reject(e);
            }
        }
    }

    [Symbol.dispose]() {
        const promise = this.promiseQueue.shift();
        if (promise) {
            promise.resolve({value: undefined, done: true});
        } else {
            this.valueQueue.push({value: undefined, done: true});
        }
    }
}