export type ConstructorOf<T, TArgs extends unknown[] = []> = abstract new (
	...args: TArgs
) => T;
export type InjectionToken<T = unknown, TArgs extends unknown[] = []> = ConstructorOf<T, TArgs> | symbol;
