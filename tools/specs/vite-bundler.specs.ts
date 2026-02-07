import {describe, test} from "node:test";
import {expect} from "expect";
import {Monorepo} from "../model/monorepo";
import {Target} from "../model/target";
import {Flags} from "../model/flags";

describe('vite-bundler', async function target() {
    const flags = new Flags(['--prod']);
	const monorepo = await Monorepo.load(flags);
	async function getBundle(pkg: string){
		const target = monorepo.get(pkg) as Target;
		const viteBuilder = monorepo.createBundler(target);
		return await viteBuilder.bundle();
	}
	await test('@cmmn/core', async function () {
		const bundle = await getBundle('@cmmn/core');
        expect(bundle.fileNames()).toEqual(['index.js']);
	});
    await test('@cmmn/sync', async function () {
        const bundle = await getBundle('@cmmn/sync');
        expect(bundle.fileNames()).toEqual(['index.js', 'storage.js']);
    });

	await test('@cmmn/examples-client', async function () {
		const bundle = await getBundle('@cmmn/examples-client');
        const json = await bundle.getBundleJson();
        // expect(assets).toContain('index.js')
        expect(json.baseURI).toEqual('/example/react');
        const index = json.assets.find(x => x.path == 'index.html');
        const regex = new RegExp(index.regex);
        expect('').toMatch(regex)
        expect('/dashboard').toMatch(regex)
        expect('@vite').not.toMatch(regex)
        expect('index.js').not.toMatch(regex)
        const allDeps = new Map<string, Set<string>>();
        for (let asset of json.assets) {
            for (let pack in asset.deps) {
                if (!allDeps.has(pack))
                    allDeps.set(pack, new Set());
                asset.deps[pack].forEach(x => allDeps.get(pack).add(x))
            }
        }
        expect(allDeps.get('/_/@cmmn/ui').size).toBe(1);
        expect(allDeps.get('/_/@cmmn/sync').size).toBe(2);
        expect(allDeps.get('/_/@cmmn/service-worker').size).toBe(1);
        expect(allDeps.get('.').size).toBeGreaterThan(1);
	});

    await test('@cmmn/examples-model', async function () {
        const bundle = await getBundle('@cmmn/examples-model');
        const json = await bundle.getBundleJson();
        const allDeps = new Map<string, Set<string>>();
        for (let asset of json.assets) {
            for (let pack in asset.deps) {
                if (!allDeps.has(pack))
                    allDeps.set(pack, new Set());
                asset.deps[pack].forEach(x => allDeps.get(pack).add(x))
            }
        }
        expect(allDeps.size).toBe(2);
        expect(allDeps.get('/_/@cmmn/core').size).toBe(1);
        expect(allDeps.get('/_/@cmmn/sync').size).toBe(1);
    });
});