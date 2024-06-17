export async function sinkTo<T>(source: AsyncIterable<T>, sink: Sink<T>) {
  for await (let t of source) {
    sink(t);
  }
}

export type Sink<T> = (t: T) => void;