import { EventGenerator } from './eventGenerator'

export function from<T>(source: EventTarget[], event: string): AsyncGenerator<T>
export function from<T>(source: EventTarget, event: string): AsyncGenerator<T>
export function from<T>(source: any, event: string): AsyncGenerator<T> {
  if (!Array.isArray(source)) source = [source]
  return new EventGenerator(source, event)
}