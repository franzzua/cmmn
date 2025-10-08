import {Target} from "../helpers/target";
import {Terminal} from "../helpers/terminal.js";
import {Flags} from "../helpers/flags";
import {TargetWebServer} from "../dev-server/target-web-server";
import {build} from "vite";
import path from "node:path";
import {DevServer} from "../dev-server/dev-server";
import {RollupOutput} from "rollup";
import {getAssets} from "../dev-server/asset-collection";
import {writeFile} from "node:fs/promises";

export async function bundle(flags: Flags) {
    const origWorkspace = flags.workspace;
    flags.workspace = undefined;
    const targets = await Target.readTargets(process.cwd(), flags);
    const devServer = new DevServer(targets);
    devServer.depServer.url = ''
    const term = new Terminal(flags, targets);
    for (let targetServer of devServer.targetServers) {
        targetServer.url = '';
        if (origWorkspace && targetServer.target.rootDir !== path.join(devServer.rootTarget.rootDir, origWorkspace))
            continue;
        if (targetServer instanceof TargetWebServer){
            const config = await targetServer.getBundleConfig();
            config.build.write = true;
            // config.base = './'

            try {
                const results = await build(config) as RollupOutput[];
                const assets = await getAssets(results);
                console.log(assets)
                term.setData(targetServer.target, {
                    state: 'ok',
                    size: assets.map(x => x.size).reduce((a, b) => a + b, 0)
                });
                await writeFile(
                    path.join(targetServer.target.rootDir, 'dist/bundle/assets.json'),
                    JSON.stringify(assets)
                );
                for (let res of results) {
                    for (let out of res.output) {
                        if (out.type == "chunk") {
                            term.term.yellow(`\t\t${out.name} -> ${out.fileName}\n`)
                        } else {
                            term.term.yellow(`\t\t${out.fileName}\n`)
                        }
                    }
                }
            } catch (e) {
                // term.setData(target, {
                //     state: 'fail'
                // });
                console.error(e.message);
            }
        }
    }
}

