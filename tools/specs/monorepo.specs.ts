import {describe, test} from "node:test";
import {Monorepo} from "../model/monorepo";
import {expect} from "expect";
import {Flags} from "../model/flags";

describe('monorepo', async () => {
    Flags.Current = new Flags(['--prod']);
    const monorepo = await Monorepo.load(process.cwd());
    await test('root', async () => {
        expect(monorepo.root.name).toBe('@cmmn/framework');
        expect(monorepo.root.entries).toHaveLength(1);
    });
    await test('sync', async () => {
        const target = monorepo.get('@cmmn/sync');
        expect(target.entries).toHaveLength(2);
        expect(target.deps).toHaveLength(2);
        expect(target.deps.map(x => x.name)).toContain('@cmmn/core');
        expect(target.deps.map(x => x.name)).toContain('loro-crdt');
    });

    await test('core', async () => {
        const target = monorepo.get('@cmmn/core');
        expect(target.entries).toHaveLength(1);
        expect(target.deps).toHaveLength(2);
        expect(target.deps.map(x => x.name)).toContain('uuidv7');
        expect(target.deps.map(x => x.name)).toContain('throttle-debounce');
    });

    await test('@libp2p/identify', async () => {
        const target = monorepo.get('@libp2p/identify');
        expect(target.rootDir).toMatch(/@libp2p\/identify$/);
        expect(target.entries).toHaveLength(1);
    });
})