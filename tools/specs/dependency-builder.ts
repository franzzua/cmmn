import { describe, test } from "node:test";
import { RolldownDependencyBuilder } from "../dev-server/rolldown-dependency-builder";
import {fileURLToPath} from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import {expect} from "../test/test";

const DependencyBuilder = RolldownDependencyBuilder;

describe('dependencyBuilder', async function dependencyBuilder(){

    await test('loro', async function loro(){
        const builder = new DependencyBuilder([], 'base');
        const res = await builder.build('loro-crdt', await getPackageJSON('loro-crdt'));
        expect(res['/']).not.toBeNull();
    })
    await test('react', async function loro(){
        const builder = new DependencyBuilder([], 'base');
        const res = await builder.build('react', await getPackageJSON('react'));
        expect(res['/']).not.toBeNull();
        expect(res['/']).toContain('export {')
    })

    await test('react/jsx-runtime', async function loro(){
        const builder = new DependencyBuilder(['react'], '/@base');
        const res = await builder.build('react/jsx-runtime', await getPackageJSON('react/jsx-runtime'));
        expect(res['/']).not.toBeNull();
        expect(res['/']).not.toContain('require_react_development')
        expect(res['/']).not.toContain('require("react")')
        expect(res['/']).toMatch(/import.*\/@base\/react/);
    })
});


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