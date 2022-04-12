export class AsyncQueue {

    private queue: Array<() => Promise<any>> = [];
    private isInvoking: boolean = false;

    public Invoke<TResult>(action: () => (Promise<TResult> | TResult)): Promise<TResult> {
        return new Promise<any>((resolve, reject) => {
            this.queue.push(() => Promise.resolve<TResult>(action())
                .then(resolve)
                .catch(reject));
            this.run();
        });
    }

    private emptyTimeout: any = null;
    private run() {
        if (this.isInvoking)
            return;
        if (this.queue.length == 0 && !this.isInvoking) {
            // this.emptyTimeout = setTimeout(() => {
            //     if (this.queue.length == 0 && !this.isInvoking)
            //         this.IsEmpty = true;
            // }, 100);
            return;
        }
        // this.emptyTimeout && clearTimeout(this.emptyTimeout);
        // this.IsEmpty = false;
        this.isInvoking = true;
        const current = this.queue.shift();
        current!().finally(() => {
            this.isInvoking = false;
            this.run();
        });
    }
}
