import {Target} from "../helpers/target.js";
import {exec, execSync} from "node:child_process";

export async function publish(...flags){
    const targets = await Target.readTargets(process.cwd(), flags);
    for (const target of targets) {
        if (target.packageJson.private)
            continue;
        try {
            execSync("yarn npm publish", {
                cwd: target.rootDir,
                stdio: "ignore",
            });
            console.log(`publish ${target.packageJson.name}`)
        }catch (e){
            console.error(`Failed publish ${target.packageJson.name}\n${e.message}`)
        }
    }
}