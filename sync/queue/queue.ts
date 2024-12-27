import {EventEmitter, inject, singleton} from "@cmmn/core";
import {Transport} from "../transport/transport";
import {Quorum} from "../quorum";

@singleton()
export class QueueBroker {
    @inject(Transport<any>) transport!: Transport<any>;
    @inject(Quorum) quorum!: Quorum;

    private cache: Record<string, Queue<any>> = {};

    public getQueue<T>(name: string) {
        return this.cache[name] ??= new Queue<T>(name, this.transport, this.quorum);
    }

    [Symbol.dispose](){
        for (let queueName in this.cache) {
            this.cache[queueName][Symbol.dispose]();
        }
        this.cache = {};
    }
}

export class Queue<T> extends EventEmitter<{
    enqueue: T;
    dequeue: T;
}> {
    private _queue: T[] = [];
    public get queue(): ReadonlyArray<T> { return this._queue; }
    private onDispose = this.transport.on(this.name, msg => {
        if (msg.id == this.quorum.leader || this.quorum.isLeader) {
            if (!msg.dequeue) {
                this._queue.push(msg.value);
                this.emit('enqueue', msg.value);
            } else {
                const value = this._queue.shift();
                this.emit('dequeue', value);
            }
        }
        if (this.quorum.isLeader){
            this.transport.send(this.name, {
                ...msg,
                id: this.quorum.id
            })
        }
    })

    constructor(private name: string,
                private transport: Transport<QueueMessage<T>>,
                private quorum: Quorum) {
        super();
    }

    enqueue(value: T) {
        if (this.quorum.isLeader) {
            this._queue.push(value);
        }
        this.transport.send(this.name, {
            value,
            id: this.quorum.id
        });
    }

    async dequeue(): Promise<T | undefined> {
        if (this._queue.length == 0) return;
        this.transport.send(this.name, {
            dequeue: true,
            id: this.quorum.id
        });
        if (this.quorum.isLeader) {
            const value = this._queue.shift();
            this.emit('dequeue');
            return value;
        } else {
            return await this.onceAsync('dequeue');
        }
    }

    async dequeueAsync() {
        if (this._queue.length == 0)
            await this.onceAsync('enqueue');
        return this.dequeue();
    }

    [Symbol.dispose]() {
        this.onDispose();
    }

}

type QueueMessage<T> = {
    value?: T;
    dequeue?: boolean;
    id: string;
};
