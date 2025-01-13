import {Target} from "../helpers/target.js";
import {createRsbuild} from "@rsbuild/core";
import { build,  } from "@rslib/core";

export async function bundle(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    for (let target of targets) {
        if (target.tsConfig.include?.length === 0)
            continue;
        const config = await target.getConfig();
        console.log(target.packageJson.name);
        await build({
            ...config,
            lib: [{
                format: 'esm',
                syntax: 'esnext',
                autoExternal: {
                    dependencies: true,
                    devDependencies: false
                },
                output: {
                    sourceMap: true
                }
            }]
        });
    }
}