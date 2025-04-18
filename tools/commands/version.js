import fs from "node:fs/promises";
import {exec} from "node:child_process";
import { getPackages } from "@manypkg/get-packages";

export async function version(flags) {
    const packages = await getPackages(process.cwd())
    for (let target of packages.packages) {
        if (!flags.version) {
            console.log(`${target.packageJson.name}: ${target.packageJson.version}`);
        } else {
            target.packageJson.version = flags.version;
            await fs.writeFile(`${target.dir}/package.json`, JSON.stringify(target.packageJson, null, '\t'));
            await exec(`git add ${target.dir}/package.json`);
        }
    }
    if (flags.version) {
        await exec(`git commit -m "version ${flags.version}"`, {
            stdio: 'inherit'
        });
    }
}

/**
 * @param target {import('../helpers/target.ts')}
 * @param version {string}
 */
function updateVersion(target, version) {
    switch (version) {
        case 'major':
            break;
        default:
            target.packageJson.version = version;
            break;
    }
}