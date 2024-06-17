import { Operator } from './index'

export function windowTime<T> (interval: number): Operator<T, T[]> {
  return async function * windowTime (gen) {
    let buffer: {data: T, date: number }[] = []
    for await (let data of gen) {
      const date = +new Date();
      buffer.push({data, date});
      const limit = date - interval;
      for (var i = 0; i < buffer.length; i++) {
        if (buffer[i].date > limit)
          break;
      }
      buffer = buffer.slice(i);
      yield buffer.map(x => x.data);
    }
  }
}