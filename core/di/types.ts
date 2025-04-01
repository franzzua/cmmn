import {Container} from "./container";

export type ConstructorOf<T, TArgs extends unknown[] = []> = new (
	...args: TArgs
) => T;
export type AbstractConstructorOf<T, TArgs extends unknown[] = []> = abstract new (
	...args: TArgs
) => T;
export type InjectionToken<T = unknown, TArgs extends unknown[] = []> =
	ConstructorOf<T, TArgs> | AbstractConstructorOf<T, TArgs> | symbol | string | ((...args: TArgs) => T);


export type FieldDecoratorResult<T, This> = (this: This, value: T) => T
export type FieldDecorator<T, This> = (_: T, ctx: ClassFieldDecoratorContext) =>
	FieldDecoratorResult<T, This>;
export type AccessorDecoratorResult<T, This> = {
	get?(this: This): T;
	set?(this: This, value: T): void;
	init?(this: This): void;
};
export type AccessorDecorator<T, This> = (_: T, ctx: ClassAccessorDecoratorContext) =>
	AccessorDecoratorResult<T, This>

export type Factory<T> = ((c: Container) => T) & { isScoped?: true }