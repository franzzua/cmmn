import {Target} from "../helpers/target";
import {Terminal} from "../helpers/terminal.js";
import {Flags} from "../helpers/flags";
import {TargetWebServer} from "../dev-server/target-web-server";
import {build} from "vite";
import path, {dirname, join} from "node:path";
import {DevServer} from "../dev-server/dev-server";
import {RollupOutput} from "rollup";
import {getAssets} from "../dev-server/asset-collection";
import {cp, mkdir, stat, writeFile} from "node:fs/promises";

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
            try {
                const bundle = await targetServer.getBundle();
                term.setData(targetServer.target, {
                    state: 'ok',
                    size: Object.values(bundle).map(x => x.length).reduce((a, b) => a + b, 0)
                });
                for (let fileName in bundle) {
                    const path = join(targetServer.target.rootDir, 'dist/bundle', fileName);
                    const dir = dirname(path);
                    await mkdir(dir, { recursive: true });
                    await writeFile(
                        path,
                        bundle[fileName],
                    );
                    term.term.yellow(`\t\t${fileName}\n`)
                }
                const publicDir = join(targetServer.target.rootDir, 'public');
                await cp(publicDir, join(targetServer.target.rootDir, 'dist/bundle/'), {
                    recursive: true
                }).catch(() => {});
            } catch (e) {
                // term.setData(target, {
                //     state: 'fail'
                // });
                console.error(e.message);
            }
        }
    }
}

