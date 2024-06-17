export function tap<T>(selector: (x: T) => void){
  return async function *(ai: AsyncIterable<T>): AsyncIterable<T> {
    for await (let t of ai) {
      selector(t);
      yield t;
    }
  }
}

