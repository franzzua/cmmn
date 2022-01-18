export class AsyncQueue {

    private queue: (() => Promise<any>)[] = [];
    private isInvoking: boolean = false;

    public Invoke<TResult>(action: () => Promise<TResult>): Promise<TResult> {
        return new Promise<any>((resolve, reject) => {
            this.queue.push(() => Promise.resolve(action())
                .then(resolve)
                .catch(reject));
            this.run();
        });
    }


    private run() {
        if (this.isInvoking || this.queue.length == 0)
            return;
        this.isInvoking = true;
        const current = this.queue.shift();
        current!().finally(() => {
            this.isInvoking = false;
            this.run();
        });
    }
}
