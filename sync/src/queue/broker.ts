import { bind, Container, inject, scoped } from '@cmmn/core';
import { RPC } from '../rpc';
import { Team } from './team';
import { Queue } from './queue';

@scoped()
export class Broker {
	private cache: Record<string, Queue<any>> = {};

	@inject(RPC) private rpc!: RPC;
	@inject(Team) team!: Team;
	@inject(Container) container!: Container;

	constructor() {
		this.onLeaderChange();
		this.team.on('leader', this.onLeaderChange);
	}

	@bind()
	onLeaderChange() {
		if (!this.team.isLeader) return;
		this.rpc.server.register(this.constructor.name, {
			get: async (name: string) => {
				return this.getQueue(name).then((q) => q.queue);
			},
		});
	}

	public async getQueue<T>(name: string) {
		return (this.cache[name] ??= await this.create(name));
	}

	private async create<T>(name: string) {
		if (this.team.isLeader) return this.container.resolve(Queue, name);
		const state = await this.rpc.client.call<T[]>(
			this.constructor.name,
			'get',
			[name],
		);
		return this.container.resolve(Queue, name, state);
	}

	[Symbol.dispose]() {
		for (let queueName in this.cache) {
			this.cache[queueName][Symbol.dispose]();
		}
		this.cache = {};
		this.team.off('leader', this.onLeaderChange);
	}
}
