import {execSync, spawn} from "node:child_process";
import {getPackages} from "@manypkg/get-packages";
import {Target} from "../helpers/target";
import fs from "node:fs/promises";
import {join} from "node:path";

export async function publish(...flags){
    const packages = await getPackages(process.cwd())
    for (const pkg of packages.packages) {
        const target = new Target(pkg.dir, flags, []);
        if (target.packageJson.private)
            continue;
        if (target.tsConfig) {
            await fs.rename(
                join(target.rootDir, './package.json'),
                join(target.rootDir, './.package.json')
            );
            const content = await target.getPublishPackageJson();

            await fs.writeFile(
                join(target.rootDir, 'package.json'),
                content,
                'utf-8'
            )
        }
        const cp = await spawn("corepack", "yarn npm publish".split(' '), {
            cwd: target.rootDir,
            stdio: "pipe",
            detached: true
        });
        let error = false;
        cp.stdout.on('data', data => {
            const str = data.toString();
            if (str.startsWith('➤ YN0000:')) return;
            target.error(data);
            error = true;
        });
        await new Promise(r => cp.stdout.on('close', r));
        if (!error) {
            target.log(`published`);
        }
        if (target.tsConfig) {
            await fs.rm(join(target.rootDir, './package.json'));
            await fs.rename(
                join(target.rootDir, './.package.json'),
                join(target.rootDir, './package.json')
            );
        }
    }
}