import type {List} from "./list";
import type {Counter} from "./counter";
import {Text} from "./text";
import {Map} from "./map";
import {LoroDoc} from "loro-crdt";

export type LWWValue<T> = { get(): T; set(value: T): void; }
export type Value = List<Scheme> | Counter | Text | Map<Scheme> | LWWValue<any>;
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

