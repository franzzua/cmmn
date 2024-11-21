import {Target} from "../helpers/target.js";
import {createBundleHandler} from "@farmfe/core";

export async function bundle(...flags){
    const targets = await Target.readTargets(process.cwd(), flags);
    for (let target of targets) {
        if (target.tsConfig.include?.length === 0)
            continue;
        const config = await target.getViteConfig();
        await createBundleHandler(config, target.logger,
            flags.includes('--watch'));
    }
}