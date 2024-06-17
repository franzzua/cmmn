export function concatMap<T, U = T> (selector: (x: T) => AsyncIterable<U>) {
  return async function * (ai: AsyncIterable<T>): AsyncIterable<U> {
    for await (let t of ai) {
      yield * selector(t)
    }
  }
}