import { describe, test } from "node:test";
import { RolldownDependencyBuilder } from "../dev-server/rolldown-dependency-builder";
import {fileURLToPath} from "node:url";
import path, {dirname, join} from "node:path";
import fs, { writeFile, rm } from "node:fs/promises";
import {expect} from "expect";
import * as crypto from "node:crypto";
import {RolldownBundler} from "../bundlers/rolldown-bundler";
import {Pack} from "../model/pack";
import {Resolver} from "../model/resolver";
import {exists, existsSync} from "node:fs";
import {JSONSchemaForNPMPackageJsonFiles} from "@schemastore/package";
import {BundleJson} from "../model/bundle";

describe('rolldown', async function dependencyBuilder(){

    await test('as-is', async function asIs(){
        await using pack = await TemporaryPack.create({
            '.': 'export const a = 1'
        });
        const builder = new RolldownBundler(pack, new Resolver([pack]));
        const res = await builder.bundle();
        expect(res.fileNames()).toEqual(['index.js']);
        expect(res.get('index.js')).toMatch(/export \{.*a.*}/);
    });
    await test('external', async function external(){
        await using pack = await TemporaryPack.create({
            './a': 'export const a = 1',
            '.': `import { a } from './a'; export const b = a + 1;`
        });
        const builder = new RolldownBundler(pack, new Resolver([pack]));
        const res = await builder.bundle();
        expect(res.fileNames()).toContain('index.js');
        expect(res.fileNames()).toContain('a.js');
        expect(res.get('index.js')).toMatch(/import \{.*a.*} from "\.\//);
        expect(res.get('index.js')).toMatch(/export \{.*b.*}/);
        expect(res.get('a.js')).toMatch(/export \{.*a.*}/);
    });
    await test('wasm', async function wasm(){
        await using pack = await TemporaryPack.create({
            '.': `import wasm from './x.wasm'; export { wasm };`
        }, {
            './x.wasm': '0ABCF1'
        });
        const builder = new RolldownBundler(pack, new Resolver([pack]));
        const res = await builder.bundle();
        expect(res.fileNames()).toContain('index.js');
        expect(res.fileNames()).toContain('x.wasm');
        expect(res.get('x.wasm').toString()).toEqual('0ABCF1');
        expect(res.get('index.js')).toMatch(/new URL\("\.\/x\.wasm/);
        expect(res.get('index.js')).toMatch(/export \{.*wasm.*}/);
    })

    await test('loro-crdt', async function wasm(){
        const pack = await Pack.read('loro-crdt');
        const builder = new RolldownBundler(pack, new Resolver([pack]));
        const bundle = await builder.bundle();
        expect(bundle.get('index.js')).not.toBeUndefined();
        const wasm = bundle.fileNames().find(x => x.endsWith('.wasm'));
        expect(bundle.get(wasm)).not.toBeUndefined();
        const json = await bundle.getBundleJson();
        const deps = new Set([...getAssetsTree(json, 'index.js')].map(x => x.path));
        expect(deps.size).toEqual(4);
        function *getAssetsTree(json: BundleJson, start: string){
            const asset = json.assets.find(x => x.path === start);
            for (let dep of asset.deps['.'] ?? [])
                yield * getAssetsTree(json, dep);
            yield asset;
        }
    })

    await test('external-pack', async function wasm(){
        await using pack = await TemporaryPack.create({
            './a': 'import { a } from "@test/external"; export const c = a + 1;',
        });
        await using external = await TemporaryPack.create({
            '.': 'export const a = 1'
        }, {}, true, '@test/external');
        const builder = new RolldownBundler(pack, new Resolver([pack, external], "@base"));
        const res = await builder.bundle();
        expect(res.get('a.js')).toContain('import { a } from "@base/_/@test/external/index.js"');
    })

    await test('react', async function wasm(){
        const react = await Pack.read('react');
        const reactDOM = await Pack.read('react-dom');
        const builder = new RolldownBundler(reactDOM, new Resolver([react, reactDOM]));
        const res = await builder.bundle();
        for (let fileName of res.fileNames()) {
            if(res.get(fileName).toString().match(/import *.*from.*"react"/))
                return;
        }
    })

    await test('uuidv7', async function wasm(){
        const uuidv7 = await Pack.read('uuidv7');
        const builder = new RolldownBundler(uuidv7, new Resolver([]));
        const res = await builder.bundle();
        expect(res.fileNames()).toEqual(['index.js']);
    })

    await test('commonjs', async function commonjs(){
        await using pack = await TemporaryPack.create({
            '.': `module.exports = { x: 2 };
        exports.a = 1;
        module.exports.c = 3;`
        }, { }, false);
        const builder = new RolldownBundler(pack, new Resolver([pack]));
        const res = await builder.bundle();
        expect(res.get('index.js')).toMatch(/export \{.*a.*}/);
        expect(res.get('index.js')).toMatch(/export \{.*c.*}/);
        expect(res.get('index.js')).toMatch(/export \{.*default.*}/);
    })

    await test('commonjs-dynamic-require', async function commonjsRequire(){
        const a = `
            exports.a = 'A_EXPORT_CONST';
        `;
        const b = `
            exports.b = 1;
            exports.getA = function dynamicRequire(){
                exports.a = require('./a.js');
            }
        `;

        await using pack = await TemporaryPack.create({
            './a': a,
            './b': b,
        }, { }, false);
        const builder = new RolldownBundler(pack, new Resolver([pack]));
        const res = await builder.bundle();
        expect(res.get('b.js')).not.toContain('A_EXPORT_CONST')
        expect(res.get('b.js')).toMatch(/export.*\{.*a.*}/);
    })
});


class TemporaryPack extends Pack implements AsyncDisposable {
    static async create(entries: Record<string, string>,
                        files: Record<string, string> = {},
                        isModule = true,
                        name = '@test/test'+Math.random().toString(36).substring(2),) {
        const  json = {
            name,
            version: '1.0.0',
            exports: {},
            type: isModule ? 'module' : 'commonjs',
        } as JSONSchemaForNPMPackageJsonFiles;
        const node_modules = this.getNodeModulesPath();
        const root = join(node_modules, name);
        await fs.mkdir(root, { recursive: true });
        for (let [name, content] of Object.entries(entries)) {
            let file = !name || name =='.' ? './index.js' : name + '.js';
            json.exports[name] = file;
            await fs.writeFile(join(root, file), content, 'utf-8');
        }
        for (let [name, content] of Object.entries(files)) {
            await fs.writeFile(join(root, name), content, 'utf-8');
        }
        await fs.writeFile(join(root, 'package.json'), JSON.stringify(json), 'utf-8');
        return new TemporaryPack(root, json);
    }

    static getNodeModulesPath(dir = process.cwd()){
        if (existsSync(dir + '/node_modules'))
            return dir + '/node_modules';
        const parent = dirname(dir);
        return this.getNodeModulesPath(parent);
    }

    async [Symbol.asyncDispose]() {
        await fs.rm(this.rootDir, {
            recursive: true,
            force: true
        });
    }

}


async function getPackageJSON(pkg) {
    const resolved = import.meta.resolve(pkg);
    const file = fileURLToPath(resolved);
    let dir = path.dirname(file);
    while (true) {
        const packageJsonText = await fs.readFile(path.resolve(dir, 'package.json'), {encoding: 'utf-8'}).catch(() => null);
        if (packageJsonText)
            return JSON.parse(packageJsonText);
        dir = path.resolve(dir, '..');
    }
}