import {Target} from "../model/target.js";
import {spawn} from "node:child_process";
import {stat, link, rm} from "node:fs/promises";
import {join, resolve} from "node:path";

const rootDir = process.cwd();

/**
 * @param flags {import("../model/flags.ts").Flags}
 * @returns {Promise<import('@swc/types').Config>}
 */
export async function lint(flags) {
    const promises = [];
    for (const target of await Target.readTargets(rootDir, flags)) {
        if (target.tsConfig.include?.length === 0)
            continue;
        const json = join(target.rootDir, 'biome.json');
        let linked = false;
        if (!await stat(json).catch(() => false)){
            await link(resolve(import.meta.dirname, '../biome.json'), json);
            linked = true;
        }
        const biome = spawn("npx", ['@biomejs/biome', 'lint', '--write', flags.unsafe ? '--unsafe' : ''],{
            cwd: target.rootDir,
        });
        biome.stdout.on('data', data => {
            console.log(`${target.packageJson.name}: ${data}`);
        });
        biome.stderr.on('data', data => {
            console.error(data.toString());
        });
        promises.push(new Promise(res => biome.on('close', async () => {
            if (linked){
                await rm(json, {force: true});
            }
            res();
        })));
    }
    await Promise.all(promises);
}
