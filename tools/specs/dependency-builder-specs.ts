import { describe, test } from "node:test";
import { RolldownDependencyBuilder } from "../dev-server/rolldown-dependency-builder";
import {fileURLToPath} from "node:url";
import path, {join} from "node:path";
import fs, { writeFile, rm } from "node:fs/promises";
import {expect} from "expect";
import * as crypto from "node:crypto";

const DependencyBuilderSpecs = RolldownDependencyBuilder;

describe('dependencyBuilder', async function dependencyBuilder(){

    await test('as-is', async function asIs(){
        const text = 'export const a = 1';
        await using file = await createTemporaryFile(text);
        const builder = new DependencyBuilderSpecs([], '/@base');
        const res = await builder.build(file.path, true);
        expect(res['']).toMatch(/export \{.*a.*}/);
    });
    await test('external', async function external(){
        const text = 'export const a = 1';
        await using fileA = await createTemporaryFile(text);
        await using fileB = await createTemporaryFile(`import { a } from '${fileA.fileName}'; export const b = a + 1;`);
        const builder = new DependencyBuilderSpecs([fileA.fileName], '/@base');
        const res = await builder.build(fileB.path, true);
        expect(res['']).toMatch(/export \{.*b.*}/);
        expect(res['']).toMatch(/import \{.*a.*} from "\/@base/);
    });
    await test('wasm', async function wasm(){
        await using wasm = await createTemporaryFile('0ABCF1', 'wasm')
        await using file = await createTemporaryFile(`
            import wasm from '${wasm.fileName}';
            export { wasm };
        `);
        const builder = new DependencyBuilderSpecs([], '/@base');
        const res = await builder.build(file.path, true);
        expect(res['']).not.toBeUndefined();
    })

    await test('loro-crdt', async function wasm(){
        const builder = new DependencyBuilderSpecs([], '/@base');
        const res = await builder.build('loro-crdt', true);
        expect(res['']).not.toBeUndefined();
    })

    await test('commonjs', async function commonjs(){
        await using file = await createTemporaryFile(`
            module.exports = { x: 2 };
            exports.a = 1;
            module.exports.c = 3;
        `, 'cjs');
        const builder = new DependencyBuilderSpecs([], 'base');
        const res = await builder.build(file.path, false);
        expect(res['']).not.toBeNull();
        expect(res['']).toMatch(/export \{.*a.*}/);
        expect(res['']).toMatch(/export \{.*c.*}/);
        expect(res['']).toMatch(/export \{.*default.*}/);
    })

    await test('commonjs-dynamic-require', async function commonjsRequire(){
        await using a = await createTemporaryFile(`
            exports.a = 'A_EXPORT_CONST';
        `, 'cjs');
        await using b = await createTemporaryFile(`
            exports.b = 1;
            exports.getA = function dynamicRequire(){
                exports.a = require('${a.fileName}');
            }
        `, 'cjs');
        const builder = new DependencyBuilderSpecs([a.fileName], '/@base');
        const res = await builder.build(b.path, false);
        expect(res['']).not.toBeUndefined();
        expect(res['']).not.toContain('A_EXPORT_CONST')
        expect(res['']).toMatch(/import.*\/@base/);
    })
});

async function createTemporaryFile(content: string, ext = 'js', fileName: string = `./${crypto.randomBytes(8).toString('hex')}.${ext}`){
    const path = join(import.meta.dirname, fileName);
    await writeFile(path, content, 'utf-8');
    return {
        fileName,
        path,
        [Symbol.asyncDispose]: () => rm(path)
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