import { inject, scoped } from '@cmmn/core';
import { RpcClient } from './rpc.client.ts';
import { RpcServer } from './rpc.server.ts';

export { RpcClient } from './rpc.client.ts';
export { RpcServer } from './rpc.server.ts';

@scoped()
export class RPC {
	@inject(RpcClient) client!: RpcClient;
	@inject(RpcServer) server!: RpcServer;
}
