import {Target} from "../helpers/target.js";
import {MultiCompiler} from "@rspack/core";
import {fs as memfs} from "memfs";
import {ufs} from "unionfs";
import path from "path";
import {runDevServer} from "../dev-server/index.js";
import fs from "node:fs";

export async function dev(...flags) {
    const {RspackDevServer} = await import("@rspack/dev-server");
    const targets = await Target.readTargets(process.cwd(), flags);
    const compilers = {};
    for (let target of targets) {
        if (target.tsConfig.include?.length === 0)
            continue;
        compilers[target.packageJson.name] = await target.getCompiler();
        // compilers[target.packageJson.name].outputFileSystem = memfs;
        compilers[target.packageJson.name].run(() => {})
    }
    const app = await runDevServer(ufs.use(memfs).use(fs));
    const {EsmHmrEngine} = await import("snowpack/lib/cjs/hmr-server-engine.js");
    const hmr = new EsmHmrEngine({
        server: app.server,
    });
    // const devServer = new RspackDevServer(
    //     Object.values(compilers)[0].options.devServer,
    //     compiler)
    // await devServer.initialize();

}