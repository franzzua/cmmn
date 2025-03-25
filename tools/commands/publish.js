import {execSync} from "node:child_process";
import {getPackages} from "@manypkg/get-packages";
import {Target} from "../helpers/target.js";
import fs from "node:fs/promises";
import {join} from "node:path";

export async function publish(...flags){
    const packages = await getPackages(process.cwd())
    for (const pkg of packages.packages) {
        const target = new Target(pkg.dir, flags, []);
        if (target.packageJson.private)
            continue;
        try {
            await fs.rename(
                join(target.rootDir, './package.json'),
                join(target.rootDir, './.package.json')
            );
            const content = await target.getPublishPackageJson();

            await fs.writeFile(
                join(target.rootDir, '.package.json'),
                content,
                'utf-8'
            )
            execSync("yarn npm publish", {
                cwd: target.dir,
                stdio: "ignore",
            });
            await fs.rm(join(target.rootDir, './package.json'));
            await fs.rename(
                join(target.rootDir, './package.json'),
                join(target.rootDir, './.package.json')
            );
            console.log(`publish ${target.packageJson.name}`)
        }catch (e){
            console.error(`Failed publish ${target.packageJson.name}\n${e.message}`)
            throw e;
        }
    }
}