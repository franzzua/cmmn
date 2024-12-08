export function filter<T> (filter: (x: T) => boolean) {
  return async function * (ai: AsyncIterable<T>): AsyncIterable<T> {
    for await (let t of ai) {
      if (filter(t)) yield t
    }
  }
}