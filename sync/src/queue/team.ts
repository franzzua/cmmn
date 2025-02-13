import { EventEmitter, Fn, inject, singleton } from '@cmmn/core';
import { Transport } from '../transport/transport';

@singleton()
export class Team
	extends EventEmitter<{
		leader: string;
		change: void;
	}>
	implements Disposable
{
	@inject(Transport<{ team: TeamMessage }>) transport!: Transport<{
		team: TeamMessage;
	}>;
	private channel = this.transport.getChannel('team');
	public id = Fn.uuid();

	constructor() {
		super();
		this.channel.broadcast({
			id: this.id,
			type: TeamMessageType.enter,
		});
	}

	users = new Set<string>([this.id]);
	leader: string = this.id;

	private getLeader() {
		let min: string | undefined = undefined;
		for (let user of this.users) {
			if (!min || user < min) min = user;
		}
		return min;
	}

	public get isLeader() {
		return this.id === this.leader;
	}

	private onDispose = this.channel.on('message', (e) => {
		switch (e.type) {
			case TeamMessageType.state:
				for (let user of e.state) {
					this.users.add(user);
				}
				break;
			case TeamMessageType.enter:
				if (this.isLeader) {
					this.channel.broadcast({
						id: this.id,
						type: TeamMessageType.state,
						state: Array.from(this.users),
					});
				}
				this.users.add(e.id);
				this.emit('change');
				break;
			case TeamMessageType.exit:
				this.users.delete(e.id);
				this.emit('change');
				break;
		}
		const oldLeader = this.leader;
		this.leader = this.getLeader();
		if (oldLeader != this.leader) this.emit('leader', this.leader);
	});

	[Symbol.dispose](): void {
		this.channel.broadcast({
			id: this.id,
			type: TeamMessageType.exit,
		});
		this.onDispose();
	}
}

export type TeamMessage = {
	id: string;
	type: TeamMessageType;
	state?: string[];
};

enum TeamMessageType {
	enter,
	exit,
	state,
}
