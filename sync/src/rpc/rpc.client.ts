import {
	Container,
	inject,
	ResolvablePromise,
	scoped,
	uuid,
} from '@cmmn/core';
import {Transport} from '../transport/transport';
import {RpcMessage, RpcService} from './types';

@scoped()
export class RpcClient {
	@inject<Transport<{
		rpc: RpcMessage;
	}>>(Transport) transport!: Transport<{
		rpc: RpcMessage;
	}>;
	private channel = this.transport.getChannel('rpc');
	private answers: Record<string, ResolvablePromise<any>> = {};

	getProxy<T extends RpcService>(name: string): RPC<T> {
		return new Proxy<RPC<T>>({} as RPC<T>, {
			get: (target: any, p: string, receiver: any): any => {
				if (typeof p === 'symbol') return undefined;
				return (target[p] ??= (...args) => {
					return this.call(name, p, args);
				});
			},
		});
	}

	getFixed<T extends RpcService>(
		name: string,
		methods: Array<keyof T>,
	): RPC<T> {
		return Object.fromEntries(
			methods.map((method) => [
				method,
				(...args) => this.call(name, method as string, args),
			]),
		) as any as RPC<T>;
	}

	call<T = any>(
		service: string,
		method: string = 'get',
		args: any[] = [],
	): Promise<T> {
		const id = uuid();
		this.channel.broadcast({
			service,
			args,
			method,
			id,
		});
		return (this.answers[id] = new ResolvablePromise<T>());
	}

	static proxy<T extends RpcService>(
		service: string,
	): (c: Container) => RPC<T> {
		return (c) => c.resolve(RpcClient).getProxy(service);
	}

	static fixed<T extends RpcService>(
		service: string,
		keys: Array<keyof T>,
	): (c: Container) => RPC<T> {
		return (c) => c.resolve(RpcClient).getFixed(service, keys);
	}

	private unsubscribe = this.transport.on('rpc', (e) => {
		if ('args' in e) return;
		if (!(e.id in this.answers)) return;
		if ('error' in e) {
			this.answers[e.id].reject(e.error);
		} else {
			this.answers[e.id].resolve(e.result);
		}
	});

	[Symbol.dispose]() {
		this.unsubscribe();
	}
}

export type RPC<T extends RpcService> = {
	[key in keyof T]: T[key] extends (...args: infer TArgs) => infer TResult
		? (
			...args: TArgs
		) => TResult extends PromiseLike<any> ? TResult : Promise<TResult>
		: T[key];
};
