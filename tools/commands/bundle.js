import {Target} from "../helpers/target.js";
import {MultiCompiler} from "@rspack/core";

export async function bundle(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    const compilers = {};
    for (let target of targets) {
        if (target.tsConfig.include?.length === 0)
            continue;
        compilers[target.packageJson.name] = await target.getCompiler();
    }
    const compiler = new MultiCompiler(compilers, {
        parallelism: targets.length,
    });
    const listener = (err, stats) => {
        if (err) {
            console.error(err)
        } else {
            console.log(stats.toString());
        }
    };
    if (flags.includes('--watch')) {
        compiler.watch({}, listener);
    } else {
        compiler.run((err, stats) => {
            listener(err,stats);
            compiler.close(() => {});
        });
    }
}