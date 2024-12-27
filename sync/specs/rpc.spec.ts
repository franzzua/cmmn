import {describe, mock, test} from "node:test";
import {BroadcastTransport} from "../transport/broadcast.transport";
import {di, Fn} from "@cmmn/core";
import {Transport} from "../transport/transport";
import {expect} from "@cmmn/tools/test";
import {RpcClient, RpcServer} from "../src/rpc";

describe('rpc', async () => {
    await test('client', async () => {
        di.override(Transport, BroadcastTransport);
        di.factory('calc', RpcClient.factory('calc'));

        try {
            const t = di.resolve(Transport);
            const listener = mock.fn();
            t.on('rpc', listener);
            const calc = di.resolve<Calc>('calc' as any);
            calc.add(1, 2);
            await Fn.asyncDelay(10);
            expect(listener.mock.callCount()).toEqual(1);
            expect(listener.mock.calls[0].arguments[0].args).toEqual([1, 2]);
            expect(listener.mock.calls[0].arguments[0].method).toEqual("add");
        } finally {
            await di[Symbol.asyncDispose]();
        }
    });
    await test('server', async () => {
        di.override(Transport, BroadcastTransport);
        di.factory('calc', () => ({
            add: (a, b) => a + b
        } as Calc));

        try {
            const rpcServer = di.resolve(RpcServer);

            const transport = di.resolve(Transport);
            const listener = mock.fn();
            transport.send('rpc', {
                id: 1,
                args: [1, 2],
                method: 'add',
                service: 'calc'
            });
            transport.on('rpc', listener);
            await Fn.asyncDelay(10);
            expect(listener.mock.callCount()).toEqual(1);
            expect(listener.mock.calls[0].arguments[0].result).toEqual(3);
            expect(listener.mock.calls[0].arguments[0].id).toEqual(1);
            transport.off('rpc', listener);
        } finally {
            await di[Symbol.asyncDispose]();
        }
    });
    await test('client-server', async () => {
        di.override(Transport, BroadcastTransport);
        const serverDI = di.child();
        const clientDI = di.child();
        clientDI.factory('calc', RpcClient.factory('calc'));
        serverDI.factory('calc', () => ({
            add: (a, b) => a + b
        } as Calc));

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
    add(a: number, b: number): Promise<number>;
}