import {Target} from "../helpers/target.js";
import {spawn} from "node:child_process";
import {stat, link, rm} from "node:fs/promises";
import {join, resolve} from "path";

const rootDir = process.cwd();

/**
 * @param flags
 * @returns {Promise<import('@swc/types').Config>}
 */
export async function format(...flags) {
    for (let target of await Target.readTargets(rootDir, flags)) {
        if (target.tsConfig.include?.length === 0)
            continue;
        const json = join(target.rootDir, 'biome.json');
        let linked = false;
        if (!await stat(json).catch(() => false)){
            await link(resolve(import.meta.dirname, '../biome.json'), json);
            linked = true;
        }
        const biome = spawn("npx", ['@biomejs/biome', 'format', '--write'],{
            cwd: target.rootDir,
        });
        biome.stdout.on('data', data => {
            console.log(`${target.packageJson.name}: ${data}`);
        });
        await new Promise(res => biome.on('close', res));
        if (linked){
            await rm(json);
        }
    }
}
