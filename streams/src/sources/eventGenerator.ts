import { EVENT } from "../base/eventType";

export class EventGenerator<T, TKey extends string = typeof EVENT> implements AsyncGenerator<T> {
  private readonly events: T[] = []
  private readonly resolvers: Array<(t: IteratorResult<T>) => void> = []
  private isListening = false;

  private listener = (t: CustomEvent<T>) => {
    if (this.resolvers.length) this.resolvers.shift()({ value: t.detail, done: false })
    else this.events.push(t.detail)
  }

  constructor (private eventTargets: EventTarget[], private event: TKey) {
  }

  [Symbol.asyncIterator] (): AsyncGenerator<T, any, unknown> {
    return this;
  }

  async stop () {
    if (!this.isListening) return
    this.isListening = false
    await Promise.all(this.eventTargets.map(x => x.removeEventListener(this.event, this.listener)));
    for (let resolver of this.resolvers) {
      resolver({ value: undefined, done: true })
    }
    await Promise.resolve();
    this.resolvers.length = 0;
    this.events.length = 0;
  }

  next(): Promise<IteratorResult<T, any>> {
    if (!this.isListening) {
      this.isListening = true
      this.eventTargets.forEach(x => x.addEventListener(this.event, this.listener))
    }
    return new Promise<IteratorResult<T>>(resolve => {
      if (this.events.length)
        resolve({ value: this.events.shift(), done: false })
      else
        this.resolvers.push(resolve)
    })
  }

  async return (): Promise<IteratorResult<T, any>> {
    await this.stop();
    return {
      done: true,
      value: null
    }
  }

  async throw (e: any): Promise<IteratorResult<T, any>> {
    await this.stop()
    return Promise.reject(e)
  }

}