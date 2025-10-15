import {describe, test} from "node:test";
import {expect} from "expect";
import {BundleJsonBuilder} from "../dev-server/bundle.json.builder";
import {Monorepo} from "../model/monorepo";
import {Resolver} from "../model/resolver";
import {ViteBundler} from "../bundlers/vite.bundler";
import {Target} from "../model/target";

describe('vite-bundler', async function target() {
	const monorepo = await Monorepo.load(process.cwd());
    const resolver = new Resolver(monorepo.packs, '@base');
	async function getBundle(pkg: string){
		const target = monorepo.get(pkg) as Target;
		const viteBuilder = new ViteBundler(target, resolver);
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
        const assets = bundle.fileNames();
        // expect(assets).toContain('index.js')
        expect(assets).toContain('index.html')
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