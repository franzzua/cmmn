import type {List} from "./list.ts";
import type {Counter} from "./counter.ts";
import {Text} from "./text.ts";
import {Map} from "./map.ts";
import {LoroDoc} from 'loro-crdt';

export type LWWValue<T> = { get(): T; set(value: T): void; }
export type Value = List<any> | Counter | Text | Map<any> | LWWValue<any>;
export type Factory<TValue extends Value> = (doc: LoroDoc, id: string) => TValue;
export type Factories =
	| Factory<List<any>>
	| Factory<Counter>
	| Factory<Text>
	| Factory<Map<any>>
	| Factory<LWWValue<any>>

export type Scheme = {
	[key: string]: Scheme;
} | Factories;

export type Infer<Shape> = Shape extends Factory<infer T> ? T
	: (Shape extends object ? {
		readonly [key in keyof Shape]: Infer<Shape[key]>;
	} : Shape);

