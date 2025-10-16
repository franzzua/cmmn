import {describe, test} from "node:test";
import {createBundler, Monorepo} from "@cmmn/tools"
import {expect} from "@cmmn/tools/test";
import {BundleLoader} from "../worker/bundle-loader";

describe("sw-bundle", async () => {
    const monorepo = await Monorepo.load(process.cwd(), ['--prod']);

    const loader = new BundleLoader(async p => {
        const pack = monorepo.packs.find(x => x.publicPath == p);
        const bundler = createBundler(pack, monorepo.resolver)
        const bundle = await bundler.bundle();
        return await bundle.getBundleJson();
    })

    await test('core', async () => {
        await loader.load('/_/@cmmn/core');
        const core = loader.bundles.get('/_/@cmmn/core');
        const uuid = loader.bundles.get('/_/uuidv7');
        expect(core).toBeDefined();
        expect(uuid).toBeDefined();
    });
    await test('example-client', async () => {
        await loader.load('/example/react');
        expectContain('/_/@cmmn/core', 'index.js', true);
        expectContain('/_/@cmmn/service-worker', 'client.js', true);
        expectContain('/_/react-dom', 'client.js');
        expectContain('/_/uuidv7', 'index.js', true);
        expectContain('/_/loro-crdt', 'loro_wasm_bg.wasm');

        function expectContain(uri: string, path: string, only: boolean = false){
            expect(loader.bundles.keys()).toContain(uri);
            expect(loader.bundles.get(uri).getAssets().map(x => x.path))
                .toContain(path);
            if (only)
                expect(loader.bundles.get(uri).getAssets()).toHaveLength(1);
        }
    })
})