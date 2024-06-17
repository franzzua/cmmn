import { GeneratorEventTarget } from "../base/generatorEventTarget";

export function toEventTarget<T>(gen: AsyncIterable<T>): EventTarget {
  return new GeneratorEventTarget(gen) as EventTarget;
}