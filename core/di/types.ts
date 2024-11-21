export type ConstructorOf<T, TArgs extends any[] = []> = abstract new (...args: TArgs) => T;
