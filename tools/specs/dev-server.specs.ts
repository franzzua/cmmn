import {describe, test} from "node:test";
import {Target} from "../helpers/target";
import {Flags} from "../helpers/flags";
import {expect} from "expect";
import {DevServer} from "../dev-server/dev-server";
import {BundleJson, TargetWebServer} from "../dev-server/target-web-server";

describe('dev-server', async function target() {
	const targets = await Target.readTargets(process.cwd(), new Flags(['--prod']));
	const devServer = new DevServer(targets);
	devServer.depServer.url = 'https://example.server'
	for (let targetServer of devServer.targetServers) {
		targetServer.url = devServer.depServer.url;
	}
	function getBundle(pkg: string){
		const targetServer = devServer.targetServers.find(x => x.target.packageJson.name == pkg);
		if (targetServer instanceof TargetWebServer) {
			return  targetServer.getBundleJson();
		}
	}
	describe('@cmmn/core', async function () {
		const bundle = await getBundle('@cmmn/core');
		await test('assets', function () {
			expect(bundle.assets).toHaveLength(1);
			expect(bundle.assets[0].path).toBe('index.js')
		});
	});

	describe('@cmmn/examples-client', async function () {
		const bundle = await getBundle('@cmmn/examples-client');
		await test('assets', function () {
			const assets = bundle.assets.map(x => x.path);
			expect(assets).toContain('index.js')
			expect(assets).toContain('index.html')
			expect(assets).toContain('manifest.json')
			expect(assets).toContain('icon.svg')
			expect(assets.find(x => x.endsWith('.wasm'))).toBeUndefined();
		});
		await test('deps', function () {
			const deps = Object.fromEntries(bundle.deps.map(x => [x.baseURI, x.path]));
			expect(deps[`${devServer.depServer.url}/_/@cmmn/ui/`]).toBe('')
			expect(deps[`${devServer.depServer.url}/_/@cmmn/react/`]).toBe('')
			expect(deps[`${devServer.depServer.url}/_/@id/react/`]).toBe('')
			expect(deps[`${devServer.depServer.url}/_/@id/react/jsx-runtime/`]).toBe('')
		});
	});

	describe('react', () => testPackage('react', [
		/^$/
	]));
	describe('loro-crdt', () => testPackage('loro-crdt/bundler', [
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