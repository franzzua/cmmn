import {getConfigOptions} from "../bundle/getConfigs.js";
import {join, relative, resolve} from "path";
import liveServer from "live-server";

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
            mount: x.mount && Object.entries(x.mount).map(([from, to]) => [from, resolve(x.rootDir, to)])
        });

    })

}
