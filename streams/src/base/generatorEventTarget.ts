import { EVENT } from "./eventType";

export class GeneratorEventTarget<T> extends EventTarget {
  constructor (private gen: AsyncIterable<T>, public type = EVENT) {
    super();
  }

  private iteratorCache = new Map<EventListenerOrEventListenerObject, AsyncIterator<T>>();
  async addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean) {
    super.addEventListener(type, callback, options);
    if (type !== this.type)
      return;
    const iterator = this.gen[Symbol.asyncIterator]();
    for await (let t of {[Symbol.asyncIterator]: () => iterator }) {
      this.dispatchEvent(new CustomEvent(this.type, { detail: t }));
    }
  }

  async removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean) {
    super.removeEventListener(type, callback, options);
    if (type !== this.type)
      return;
    const iterator = this.iteratorCache.get(callback);
    if (!iterator)
      return;
    await iterator.return();
  }

}