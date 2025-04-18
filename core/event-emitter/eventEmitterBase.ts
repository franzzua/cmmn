import {Fn, ResolvablePromise} from "../helpers";
import {BaseCell, Cell} from "../cell";

export abstract class EventEmitterBase<
	TEvents = Record<never, never>,
> {
	public abstract on<TEventName extends keyof TEvents>(
		eventName: TEventName,
		listener: (data: TEvents[TEventName]) => void,
		...rest
	): () => void;

	public abstract off<TEventName extends keyof TEvents>(
		eventName: TEventName,
		listener: (data: TEvents[TEventName]) => void,
	): void;

	public once<TEventName extends keyof TEvents>(
		eventName: TEventName,
		listener: (data: TEvents[TEventName]) => void,
		...rest
	) {
		const onceListener = (data) => {
			listener(data);
			this.off(eventName, onceListener);
		};
		this.on(eventName, onceListener, ...rest);
		return () => this.off(eventName, onceListener);
	}

	public onceAsync<TEventName extends keyof TEvents>(
		eventName: TEventName,
		...rest
	): Promise<TEvents[TEventName]> {
		return new Promise((resolve) => this.once(eventName, resolve, ...rest));
	}


	iterate<TEventName extends keyof TEvents>(eventName: TEventName): AsyncIterable<TEvents[TEventName]> {
		return {
			[Symbol.asyncIterator]: () => this[Symbol.asyncIterator](eventName)
		};
	}

	[Symbol.asyncIterator]<TEventName extends keyof TEvents>(eventName: TEventName): AsyncIterator<TEvents[TEventName]> {
		const requests: Array<ResolvablePromise<IteratorResult<TEvents[TEventName]>>> = [];
		const events: Array<IteratorResult<TEvents[TEventName]>> = [];
		const unsubscribe = this.on(eventName, value => {
			const result: IteratorResult<TEvents[TEventName]> = {done: false, value};
			if (requests.length)
				requests.shift().resolve(result);
			else
				events.push(result);
		})
		return {
			next(...args): Promise<IteratorResult<TEvents[TEventName], any>> {
				if (events.length)
					return Promise.resolve(events.shift());
				const promise = new ResolvablePromise<IteratorResult<TEvents[TEventName]>>();
				requests.push(promise);
				return promise;
			},
			return(value?: any): Promise<IteratorResult<TEvents[TEventName], any>> {
				events.length = 0;
				events.push({done: true, value});
				for (let request of requests) {
					request.resolve(events[0]);
				}
				unsubscribe();
			},
			throw(e?: any): Promise<IteratorResult<TEvents[TEventName], any>> {
				events.length = 0;
				events.push({done: true, value: undefined});
				for (let request of requests) {
					request.resolve(events[0]);
				}
				requests.length = 0;
				unsubscribe();
			}
		}
	}

	toCell<TEventName extends keyof TEvents, TTypes extends [TEvents[TEventName], ...unknown[]]>(
		eventName: TEventName, ...transforms: Chain<TTypes>
	): BaseCell<ChainResult<TTypes>> {
		const source = this.iterate(eventName);
		const result = Fn.pipe(...transforms as any)(source) as AsyncIterable<ChainResult<TTypes>>;
		return Cell.fromAI(result[Symbol.asyncIterator]());
	}
}

type Operator<T1, T2> = (input: AsyncIterable<T1>) => AsyncIterable<T2>;
type Chain<TTypes extends unknown[]> = [...(
	TTypes extends [infer T1, infer T2, ...(infer TOthers)]
		? [Operator<T1, T2>, ...Chain<[T2, ...TOthers]>]
		: []
	)];
type ChainResult<TTypes extends unknown[]> = TTypes extends [infer T1] ? T1
	: TTypes extends [infer T1, ...(infer TOther)] ? ChainResult<TOther> : never;