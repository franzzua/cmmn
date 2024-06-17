
export class NaturalNumbers implements AsyncGenerator<number> {
  constructor() {
  }

  [Symbol.asyncIterator] (): AsyncGenerator<number, any, unknown> {
    return this;
  }

  private isStopped = false;
  async stop () {
    this.isStopped = true;
  }

  private i = 0;
  async next(): Promise<IteratorResult<number, any>> {
    if (this.isStopped)
      this.isStopped = false;
    await new Promise(r => setTimeout(r, 10));
    return {
      value: this.i++,
      done: false
    }
  }

  async return (): Promise<IteratorResult<number, any>> {
    await this.stop();
    return {
      done: true,
      value: null
    }
  }

  async throw (e: any): Promise<IteratorResult<number, any>> {
    await this.stop()
    return Promise.reject(e)
  }
}