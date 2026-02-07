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
        // expect(assets).toContain('manifest.json')
        // expect(assets).toContain('icon.svg')
        // const deps = new Set(bundle.deps.map(x => x.baseURI.substring(baseUrl.length)));
        // expect(deps).toContain(`/_/@cmmn/ui/index.js`);
        // expect(deps).toContain(`/_/@cmmn/service-worker/client.js`);
        // expect(deps).toContain(`/_/@cmmn/react/index.js`);
	});
    //
	// await describe('react', () => testPackage('react', [
	// 	/^$/
	// ]));
	// await describe('loro-crdt', () => testPackage('loro-crdt/bundler', [
	// 	/^$/, /^@_\/.*/, /^@_\/.*/, /^@_\/.*/
	// ]));
    //
	// async function testPackage(pkg: string, assets: RegExp[]){
	// 	const bundle: Record<string, string | Uint8Array> = await devServer.depServer.getBundle(pkg);
	// 	const json = JSON.parse(bundle['@_/bundle.json'] as string) as BundleJson;
	// 	await test('assets', async function () {
	// 		expect(json.assets).toHaveLength(assets.length);
	// 		for (let i = 0; i < json.assets.length; i++){
	// 			let asset = json.assets[i];
	// 			expect(asset.path).toMatch(assets[i])
	// 			expect(await devServer.depServer.getAsset(pkg + '/'+asset.path)).not.toBeNull();
	// 		}
	// 	});
	// }
});