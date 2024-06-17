import { Operator } from './index'
import { SharedGeneratorEventTarget } from '../base/sharedGeneratorEventTarget'
import { EventGenerator } from "../sources/eventGenerator";
import { EVENT } from "../base/eventType";

export function share<T>(): Operator<T, T>{
  return function (ai: AsyncIterable<T>): AsyncIterable<T> {
    const ee = new SharedGeneratorEventTarget<T>(ai, EVENT);
    return {
      [Symbol.asyncIterator]() {
        return new EventGenerator([ee], EVENT);
      }
    }
  }
}

