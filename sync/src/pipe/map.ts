export function map<TThis, TResult, TArgs extends unknown[], UArgs extends unknown[]>(
    selector: (this: TThis, ...x: TArgs) => UArgs
): Functor<TResult, TThis, UArgs, TResult, TThis, TArgs> {
    return fn => function (this: TThis, ...args) {
        return fn.apply(this, selector.apply(this, args)) as TResult;
    }
}
export function filter<TThis, TResult, TArgs extends unknown[]>(filter: (...x: TArgs) => boolean): Functor<TResult, TThis, TArgs, TResult | undefined> {
    return fn => function (this: TThis, ...args) {
        if (filter.apply(this, args))
            return fn.apply(this, args);
    }
}

export type Func<TResult, TThis, TArgs extends unknown[]> = (this: TThis, ...args: TArgs) => TResult;
export type Functor<
    TResult, TThis, TArgs extends unknown[],
    UResult = TResult, UThis = TThis, UArgs extends unknown[] = TArgs
> = (fn: Func<TResult, TThis, TArgs>) => Func<UResult, UThis, UArgs>