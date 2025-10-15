import {describe, test} from "node:test";
import {Monorepo} from "../model/monorepo";
import {expect} from "expect";
import {Flags} from "../model/flags";
import {Resolver} from "../model/resolver";

describe('resolver', async () => {
    const monorepo = await Monorepo.load(process.cwd());
    const resolver = new Resolver([...monorepo.packs.values()], '@base/');

    await test('core', async () => {
        const resolved = resolver.resolveId('@cmmn/core');
        expect(resolved.id).toBe('@base/@cmmn/core/index.ts');
        expect(resolved.pack.name).toBe('@cmmn/core');
        expect(resolved.path).toBe('index.ts');
    });

    await test('sync', async () => {
        const resolved = resolver.resolveId('@cmmn/sync');
        expect(resolved.id).toBe('@base/@cmmn/sync/index.ts');
        expect(resolved.pack.name).toBe('@cmmn/sync');
        expect(resolved.path).toBe('index.ts');
        const storage = resolver.resolveId('@cmmn/sync/storage');
        expect(storage).not.toBeUndefined();
    });

});

describe('resolver-deps', async () => {
    const monorepo = await Monorepo.load(process.cwd());
    const resolver = new Resolver([...monorepo.packs.values()], '@base/');

    await test('loro-crdt', async () => {
        const resolved = resolver.resolveId('loro-crdt');
        expect(resolved.id).toBe('@base/loro-crdt/index.js');
        expect(resolved.pack.name).toBe('loro-crdt');
        expect(resolved.path).toBe('index.js');
    });

    await test('react', async () => {
        const resolved = resolver.resolveId('react');
        expect(resolved.id).toBe('@base/react/index.js');
        expect(resolved.pack.name).toBe('react');
        expect(resolved.path).toBe('index.js');
    });

});

describe('resolver-prod', async () => {
    Flags.Current = new Flags(['--prod']);
    const monorepo = await Monorepo.load(process.cwd());
    const resolver = new Resolver([...monorepo.packs.values()], '@base/');

    await test('core', async () => {
        const resolved = resolver.resolveId('@cmmn/core');
        expect(resolved.id).toBe('@base/@cmmn/core/index.js');
        expect(resolved.pack.name).toBe('@cmmn/core');
        expect(resolved.path).toBe('index.js');
    });

    await test('sync', async () => {
        const resolved = resolver.resolveId('@cmmn/sync');
        expect(resolved.id).toBe('@base/@cmmn/sync/index.js');
        expect(resolved.pack.name).toBe('@cmmn/sync');
        expect(resolved.path).toBe('index.js');
        const storage = resolver.resolveId('@cmmn/sync/storage');
        expect(storage.id).toBe('@base/@cmmn/sync/storage.js');
    });


});