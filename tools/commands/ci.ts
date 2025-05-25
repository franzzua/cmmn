import {getPackages} from "@manypkg/get-packages";
import fs from "node:fs/promises";
import {join} from "node:path";
import {Flags} from "../helpers/flags";

export async function clean(flags: Flags){
    const packages = await getPackages(process.cwd())
    for (const pkg of packages.packages) {
        if (flags.workspace && flags.workspace != pkg.relativeDir)
            continue;
        await fs.rm(join(pkg.dir, 'dist'), { recursive: true }).catch(() => void 0);
    }
}