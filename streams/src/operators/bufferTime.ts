import { timer } from '../sources/timer'
import { Operator } from './index'
import { EVENT } from "../base/eventType";
import { GeneratorEventTarget } from "../base/generatorEventTarget";

export function bufferTime<T>(interval: number): Operator<T, T[]> {
  return async function * bufferTime (gen) {
    const buffer: T[] = []
    const emitter = new GeneratorEventTarget(gen, EVENT);
    const listener = (x: CustomEvent) => buffer.push(x.detail)
    emitter.addEventListener(EVENT, listener);
    for await (let index of timer(interval)) {
      if (buffer.length == 0) continue;
      yield buffer.slice();
      buffer.length = 0
    }
    emitter.removeEventListener(EVENT, listener);
  }
}