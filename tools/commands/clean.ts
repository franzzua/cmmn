import fs from "node:fs/promises";
import {join} from "node:path";
import {Flags} from "../model/flags.ts";
import {Target} from "../model/target.ts";
import * as process from "node:process";
import {Monorepo} from "../model/monorepo.ts";

export async function clean(flags: Flags){
    const monorepo = await Monorepo.load(flags);
    for (const target of monorepo.packs) {
        target.log('remove dist');
        await fs.rm(join(target.rootDir, 'dist'), { recursive: true }).catch(() => void 0);
        target.log('remove node_modules');
        if (flags.args.includes('--modules'))
            await fs.rm(join(target.rootDir, 'node_modules'), { recursive: true }).catch(() => void 0);
    }
}