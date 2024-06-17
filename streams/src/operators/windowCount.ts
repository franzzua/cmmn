import { Operator } from './'

export function windowCount<T> (count: number): Operator<T, T[]> {
  return async function * buffer (gen) {
    const buffer = []
    for await (let x of gen) {
      buffer.push(x)
      if (buffer.length == count) {
        yield buffer.slice()
        buffer.shift()
      }
    }
  }
}