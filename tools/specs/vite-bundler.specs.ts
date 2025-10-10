import {describe, test} from "node:test";
import {Target} from "../helpers/target";
import {Flags} from "../helpers/flags";
import {expect} from "expect";
import {DevServer} from "../dev-server/dev-server";
import {BundleJson, TargetWebServer} from "../dev-server/target-web-server";
import {ViteBuilder} from "../dev-server/vite.builder";

describe('vite-bundler', async function target() {
	const targets = await Target.readTargets(process.cwd(), new Flags(['--prod']));

	function getBundle(pkg: string){
		const target = targets.find(x => x.packageJson.name == pkg);
		const viteBuilder = new ViteBuilder(target, null, '@base@');
		return viteBuilder.getBundle();
	}
	await describe('@cmmn/core', async function () {
		const bundle = await getBundle('@cmmn/core');
		await test('assets', function () {
			expect(bundle.assets).toHaveLength(1);
			expect(bundle.assets[0].path).toBe('index.js')
		});
	});

	await describe('@cmmn/examples-client', async function () {
		const bundle = await getBundle('@cmmn/examples-client');
		await test('assets', function () {
			const assets = bundle.assets.map(x => x.path);
			expect(assets).toContain('index.js')
			expect(assets).toContain('index.html')
			expect(assets).toContain('manifest.json')
			expect(assets).toContain('icon.svg')
		});
		await test('deps', function () {
			const deps = Object.fromEntries(bundle.deps.map(x => [x.baseURI, x.path]));
			expect(deps[`${devServer.depServer.url}/_/@cmmn/ui/`]).toBe('index.js')
			expect(deps[`${devServer.depServer.url}/_/@id/react/`]).toBe('')
			expect(deps[`${devServer.depServer.url}/_/@id/react/jsx-runtime/`]).toBe('')
		});
	});

	await describe('react', () => testPackage('react', [
		/^$/
	]));
	await describe('loro-crdt', () => testPackage('loro-crdt/bundler', [
		/^$/, /^@_\/.*/, /^@_\/.*/, /^@_\/.*/
	]));

	async function testPackage(pkg: string, assets: RegExp[]){
		const bundle: Record<string, string | Uint8Array> = await devServer.depServer.getBundle(pkg);
		const json = JSON.parse(bundle['@_/bundle.json'] as string) as BundleJson;
		await test('assets', async function () {
			expect(json.assets).toHaveLength(assets.length);
			for (let i = 0; i < json.assets.length; i++){
				let asset = json.assets[i];
				expect(asset.path).toMatch(assets[i])
				expect(await devServer.depServer.getAsset(pkg + '/'+asset.path)).not.toBeNull();
			}
		});
	}
});