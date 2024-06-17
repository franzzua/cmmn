export function map<T, U = T>(selector: (x: T) => U){
  return async function *(ai: AsyncIterable<T>): AsyncIterable<U> {
    for await (let t of ai) {
      yield selector(t);
    }
  }
}

export function mapTo<T, U>(value: U){
  return async function *(ai: AsyncIterable<T>): AsyncIterable<U> {
    for await (let t of ai) {
      yield value;
    }
  }
}

