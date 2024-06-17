import { EVENT } from "./eventType";

export class SharedGeneratorEventTarget<T> extends EventTarget {
  constructor (private gen: AsyncIterable<T>, public type = EVENT) {
    super();
  }
  private subscriptionsCount = 0;

  addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean) {
    super.addEventListener(type, callback, options);
    if (type !== this.type)
      return;
    if (this.subscriptionsCount == 0){
      this.subscribe().catch();
    }
    this.subscriptionsCount++;
  }

  async removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean) {
    super.removeEventListener(type, callback, options);
    if (type !== this.type)
      return;
    this.subscriptionsCount--;
    if (this.subscriptionsCount == 0){
      await this.unsubscribe();
    }
  }

  private iterator: AsyncIterator<T> | undefined;
  async subscribe(){
    if (this.iterator !== undefined)
      throw `Memory Leak`;
    this.iterator = this.gen[Symbol.asyncIterator]();
    for await (let t of {[Symbol.asyncIterator]: () => this.iterator }) {
      this.dispatchEvent(new CustomEvent(this.type, { detail: t }));
    }
  }

  async unsubscribe(){
    await this.iterator.return();
    this.iterator = undefined;
  }

}