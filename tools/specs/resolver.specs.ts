import {describe, test} from "node:test";
import {Monorepo} from "../model/monorepo";
import {expect} from "expect";
import {Flags} from "../model/flags";

describe('resolver', async () => {
    const monorepo = await Monorepo.load();

    await test('core', async () => {
        const resolved = monorepo.resolver.resolveId('@cmmn/core');
        expect(resolved.id).toBe('/_/@cmmn/core/index.ts');
        expect(resolved.pack.name).toBe('@cmmn/core');
        expect(resolved.path).toBe('index.ts');
    });

    await test('sync', async () => {
        const resolved = monorepo.resolver.resolveId('@cmmn/sync');
        expect(resolved.id).toBe('/_/@cmmn/sync/index.ts');
        expect(resolved.pack.name).toBe('@cmmn/sync');
        expect(resolved.path).toBe('index.ts');
        const storage = monorepo.resolver.resolveId('@cmmn/sync/storage');
        expect(storage).not.toBeUndefined();
    });

});

describe('resolver-deps', async () => {
    const monorepo = await Monorepo.load();

    await test('loro-crdt', async () => {
        const resolved = monorepo.resolver.resolveId('loro-crdt');
        expect(resolved.id).toBe('/_/loro-crdt/index.js');
        expect(resolved.pack.name).toBe('loro-crdt');
        expect(resolved.path).toBe('index.js');
    });

    await test('react', async () => {
        const resolved = monorepo.resolver.resolveId('react');
        expect(resolved.id).toBe('/_/react/index.js');
        expect(resolved.pack.name).toBe('react');
        expect(resolved.path).toBe('index.js');
    });

});

describe('resolver-prod', async () => {
    const monorepo = await Monorepo.load(new Flags(['--prod']));

    await test('core', async () => {
        const resolved = monorepo.resolver.resolveId('@cmmn/core');
        expect(resolved.id).toBe('/_/@cmmn/core/index.js');
        expect(resolved.pack.name).toBe('@cmmn/core');
        expect(resolved.path).toBe('index.js');
    });

    await test('sync', async () => {
        const resolved = monorepo.resolver.resolveId('@cmmn/sync');
        expect(resolved.id).toBe('/_/@cmmn/sync/index.js');
        expect(resolved.pack.name).toBe('@cmmn/sync');
        expect(resolved.path).toBe('index.js');
        const storage = monorepo.resolver.resolveId('@cmmn/sync/storage');
        expect(storage.id).toBe('/_/@cmmn/sync/storage.js');
    });


});