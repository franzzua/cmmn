import { Operator } from './'

export function pipe<T, U> (ai: AsyncIterable<T>, ...operators: OperatorChain<T, U>): AsyncIterable<U> {
    return (operators as Array<Operator<unknown, unknown>>)
      .reduce<AsyncIterable<unknown>>((ai, o) => o(ai), ai as AsyncIterable<unknown>) as AsyncIterable<U>
}

export type OperatorChain<T, U> = |
    [Operator<T, U>] |
    [Operator<T, unknown>, ...Array<Operator<unknown, unknown>>, Operator<unknown, U>]
;