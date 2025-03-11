import {execSync} from "node:child_process";
import {getPackages} from "@manypkg/get-packages";

export async function publish(...flags){
    const packages = await getPackages(process.cwd())
    for (const target of packages.packages) {
        if (target.packageJson.private)
            continue;
        try {
            execSync("yarn npm publish", {
                cwd: target.dir,
                stdio: "ignore",
            });
            console.log(`publish ${target.packageJson.name}`)
        }catch (e){
            console.error(`Failed publish ${target.packageJson.name}\n${e.message}`)
        }
    }
}