import { Operator } from './index'

export function takeUntil<T>(p: AsyncIterable<unknown>): Operator<T, T> {
  return async function * (ai: AsyncIterable<T>): AsyncIterable<T> {
    const takeUntilAI = p[Symbol.asyncIterator]();
    let untilResolved = false;
    takeUntilAI.next().then(async () => {
      untilResolved = true;
      await takeUntilAI.return();
    })
    for await (let x of ai) {
      if (untilResolved) return;
      yield x;
    }
  }
}