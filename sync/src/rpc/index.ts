import { inject, scoped } from '@cmmn/core';
import { RpcClient } from './rpc.client';
import { RpcServer } from './rpc.server';

export { RpcClient } from './rpc.client';
export { RpcServer } from './rpc.server';

@scoped()
export class RPC {
	@inject(RpcClient) client!: RpcClient;
	@inject(RpcServer) server!: RpcServer;
}
