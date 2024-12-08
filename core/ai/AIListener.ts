import {EventEmitter} from "../event-emitter";

export class AIListener<T> extends EventEmitter<{ value: T }> {
    constructor(private ai: AsyncIterable<T>) {
        super();
    }

    private iterator: AsyncIterator<T> | undefined;
    public awaiter: Promise<void> | undefined;

    protected subscribe(eventName: keyof { value: T }) {
        super.subscribe(eventName);
        this.iterator = this.ai[Symbol.asyncIterator]();
        this.isStopped = false;
        this.awaiter = this.listen();
    }

    protected unsubscribe(eventName: keyof { value: T }) {
        super.unsubscribe(eventName);
        this.iterator.return();
        this.iterator = undefined;
        this.isStopped = true;
    }

    private isStopped = false;

    private async listen() {
        while (1) {
            const res = await this.iterator.next();
            if (res.done) return;
            this.emit('value', res.value);
            if (this.isStopped) return;
        }
    }

}