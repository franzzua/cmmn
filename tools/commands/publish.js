import {execSync} from "node:child_process";
import {getPackages} from "@manypkg/get-packages";
import {Target} from "../helpers/target.js";

export async function publish(...flags){
    const packages = await getPackages(process.cwd())
    for (const pkg of packages.packages) {
        const target = new Target(pkg.dir, flags, []);
        if (target.packageJson.private)
            continue;
        try {
            await target.writePackageJson();
            // execSync("yarn npm publish", {
            //     cwd: target.dir,
            //     stdio: "ignore",
            // });
            console.log(`publish ${target.packageJson.name}`)
        }catch (e){
            console.error(`Failed publish ${target.packageJson.name}\n${e.message}`)
        }
    }
}