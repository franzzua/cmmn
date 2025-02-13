import { describe, mock, test } from 'node:test';
import { BroadcastTransport } from '../src/transport/broadcast.transport';
import { di, Fn } from '@cmmn/core';
import { Transport } from '../src/transport/transport';
import { expect } from '@cmmn/tools/test';
import { RpcClient, RpcServer } from '../src/rpc';

describe('rpc', async () => {
	await test('proxy', async () => {
		di.override(Transport, BroadcastTransport);
		const serverDI = di.child();
		const clientDI = di.child();
		clientDI.factory('calc', RpcClient.proxy('calc'));
		serverDI.factory(
			'calc',
			() =>
				({
					add: (a, b) => a + b,
				}) as Calc,
		);

		try {
			const rpcServer = serverDI.resolve(RpcServer);
			const calc = clientDI.resolve<Calc>('calc' as any);
			expect(await calc.add(1, 2)).toEqual(3);
		} finally {
			await serverDI[Symbol.asyncDispose]();
			await clientDI[Symbol.asyncDispose]();
			await di[Symbol.asyncDispose]();
		}
	});

	await test('fixed', async () => {
		di.override(Transport, BroadcastTransport);
		const serverDI = di.child();
		const clientDI = di.child();

		// @ts-ignore
		clientDI.factory('calc', RpcClient.fixed<Calc>('calc', ['add']));
		serverDI.factory(
			'calc',
			() =>
				({
					add: (a, b) => a + b,
				}) as Calc,
		);

		try {
			const rpcServer = serverDI.resolve(RpcServer);
			const calc = clientDI.resolve<Calc>('calc' as any);
			expect(await calc.add(1, 2)).toEqual(3);
		} finally {
			await serverDI[Symbol.asyncDispose]();
			await clientDI[Symbol.asyncDispose]();
			await di[Symbol.asyncDispose]();
		}
	});
});

interface Calc {
	add(a: number, b: number): number;
}
