import {Container} from "./container";

export type ConstructorOf<T, TArgs extends unknown[] = []> = new (
	...args: TArgs
) => T;
export type AbstractConstructorOf<T, TArgs extends unknown[] = []> = abstract new (
	...args: TArgs
) => T;
export type InjectionToken<T = unknown, TArgs extends unknown[] = []> =
	ConstructorOf<T, TArgs> | AbstractConstructorOf<T, TArgs> | symbol | string | ((...args: TArgs) => T);


export type FieldDecorator<This, Value> = (
	target: unknown,
	context: ClassFieldDecoratorContext<This, Value>
) => (
	| void
	| ((initialValue: Value | undefined) => Value)
	);

// 	ClassAccessorDecoratorResult<This, T>
export type AccessorDecorator<This, Value> = (
	target: ClassAccessorDecoratorTarget<This, Value>,
	context: ClassAccessorDecoratorContext<This, Value>
) => (
	| void
	| ClassAccessorDecoratorResult<This, Value>
	);


export type Factory<T> = ((c: Container) => T) & { isScoped?: true }