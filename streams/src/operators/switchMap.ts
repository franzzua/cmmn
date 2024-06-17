import { takeUntil } from './takeUntil'
import { share } from "./share";

export function switchMap<T, U> (selector: (x: T) => AsyncIterable<U>) {
  return async function * (ai: AsyncIterable<T>): AsyncIterable<U> {
    const aiShared = share<T>()(ai);
    for await (let t of aiShared) {
      const switcher = takeUntil<U>(aiShared)(selector(t));
      yield * switcher;
    }
  }
}