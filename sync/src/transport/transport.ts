import { EventEmitter, EventEmitterBase } from '@cmmn/core';

export abstract class Transport<
	In extends Record<string, any>,
	Out extends Record<string, any> = In,
> extends EventEmitterBase<In> {
	abstract getChannel<TKey extends keyof In>(
		channel: TKey,
	): TransportChannel<In[TKey]>;
}

export interface TransportChannel<T>
	extends EventEmitter<{
		message: T;
	}> {
	broadcast(message: T): void;
}
