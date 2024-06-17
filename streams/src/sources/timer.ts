import { from } from './from'
import { EVENT } from "../base/eventType";

export class Timer extends EventTarget {
  constructor (private interval: number = 0) {
    super();
  }

  private timerId: number | null = null;

  subscribe(){
    let index = 0;
    this.timerId = setInterval((x) => {
      this.dispatchEvent(new CustomEvent<number>(EVENT, {
        detail: index++
      }));
    }, this.interval);
  }

  unsubscribe(){
    clearInterval(this.timerId);
  }

}

export function timer (interval: number): AsyncIterable<number> {
  return from(new Timer(interval), EVENT)
}