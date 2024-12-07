import {map} from "./map";
import {BaseCell} from "@cmmn/core";
import {Cell} from "@cmmn/core";

export function pipe<T, TOther extends Array<unknown>, U>(
    ai: AsyncIterable<T>,
    chain: OperatorChain<[T, ...TOther, U]>
): AsyncIterable<U> {
    return chain.reduce((ai, o) => o(ai), ai) as AsyncIterable<U>;
}

export type Operator<T, U> = (source: AsyncIterable<T>) => AsyncIterable<U>;

export type OperatorChain<T extends Array<unknown>> = Array<Operator<unknown, unknown>> & (
    T extends [infer T1, infer T2, ...infer TOther extends Array<unknown>]
        ? [Operator<T1, T2>, ...OperatorChain<[T2, ...TOther]>]
        : []
    );



export function sink<T>(ai: AsyncIterable<T>): BaseCell<T> {
    return new SinkCell<T>(ai);
}

class SinkCell<T> extends BaseCell<T | undefined> {
    constructor(private ai: AsyncIterable<T>) {
        super(undefined);
    }

    active(){
        super.active();
        this.run();
    }

    disactive(){
        super.disactive();
        this.iterator.return();
    }

    private iterator: AsyncIterator<T>;
    async run(){
        this.iterator = this.ai[Symbol.asyncIterator]();
        let value: IteratorResult<T>;
        while (!(value = await this.iterator.next()).done)
            this.set(value.value);
    }
}