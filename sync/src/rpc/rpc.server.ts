import { Container, inject, scoped } from '@cmmn/core';
import { Transport } from '../transport/transport';
import { RpcMessage, RpcService } from './types';

@scoped()
export class RpcServer {
	@inject(Transport<{ rpc: RpcMessage }>) transport!: Transport<{
		rpc: RpcMessage;
	}>;
	@inject(Container) container!: Container;
	private channel = this.transport.getChannel('rpc');

	private unsubscribe = this.channel.on('message', async (e) => {
		if (!('args' in e)) return;
		const service = this.container.resolve(e.service as any);
		try {
			const result = await service[e.method].apply(service, e.args);
			this.channel.broadcast({
				id: e.id,
				result,
			});
		} catch (e) {
			this.channel.broadcast({
				id: e.id,
				error: e.message,
			});
		}
	});

	register(name: string, service: RpcService) {
		this.container.const(name, service);
	}

	[Symbol.dispose]() {
		this.unsubscribe();
	}
}
