import { EVENT } from "../base/eventType";
import { EventGenerator } from "./eventGenerator";
import { GeneratorEventTarget } from "../base/generatorEventTarget";

export function merge<T1, T2> (gens: [AsyncIterable<T1>, AsyncIterable<T2>]): AsyncIterable<T1 | T2>
export function merge<T> (gens: Array<AsyncIterable<T>>): AsyncIterable<T> {
  const eventTargets = gens.map(x => new GeneratorEventTarget<T>(x));
  return new EventGenerator(eventTargets, EVENT)
}