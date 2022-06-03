import {getConfigOptions} from "../bundle/getConfigs.js";
import {join, relative} from "path";
import liveServer from "live-server";
import path from "path";

export function serve(...options) {
    const configs = getConfigOptions({
        project: options.includes('-b'),
    });
    configs.filter(x => x.port).forEach(async x => {
        const root = relative(process.cwd(), join(x.rootDir, x.outDir ?? 'dist/bundle'));
        const server = await liveServer.start({
            root: root,
            file: 'index.html',
            port: x.port,
            open: false,
            mount: x.mount && Object.entries(x.mount).map(([from, to]) => [from, path.resolve(x.rootDir, to)])
        });

    })

}
