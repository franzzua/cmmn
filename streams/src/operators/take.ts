export function take<T> (count: number) {
  let i = 0
  return async function * (ai: AsyncIterable<T>): AsyncIterable<T> {
    for await (let t of ai) {
      yield t;
      i++;
      if (i >= count) return
    }
  }
}

export function skip<T> (count: number) {
  let i = 0
  return async function * (ai: AsyncIterable<T>): AsyncIterable<T> {
    for await (let t of ai) {
      i++;
      if (i <= count) continue;
      yield t;
    }
  }
}