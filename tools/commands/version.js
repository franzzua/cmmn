import {Target} from "../helpers/target.js";
import fs from "node:fs/promises";
import {exec, execSync} from "node:child_process";

export async function version(flags){
    const targets = await Target.readTargets(process.cwd(), flags);
    for (const target of targets) {
        if (!flags.version){
            console.log(`${target.packageJson.name}: ${target.packageJson.version}`);
        } else {
            target.packageJson.version = flags.version;
            await fs.writeFile(`${target.rootDir}/package.json`, JSON.stringify(target.packageJson, null, '\t'));
            await exec(`git add ${target.rootDir}/package.json`);
        }
    }
    if (flags.version) {
        await exec(`git commit -m "version ${flags.version}"`, {
            stdio: 'inherit'
        });
    }
}

/**
 * @param target {import('../helpers/target.js')}
 * @param version {string}
 */
function updateVersion(target, version){
    switch (version){
        case 'major':
            break;
        default:
            target.packageJson.version = version;
            break;
    }
}