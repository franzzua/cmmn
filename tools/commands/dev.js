import {Target} from "../helpers/target.js";
import {getNodeModulesMiddleware, getTargetMiddleware} from "../dev-server/index.js";
import {fastify} from "fastify";
import {createServer} from "vite";

const prefix = '_';

export async function dev(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    const resolver = (id) => {
        const target = targets.find(x => id.startsWith(x.packageJson.name));
        if (target)
            return `/${prefix}/` + id;
    }
    const app = fastify({});
    for (let target of targets) {
        if (target.tsConfig.include?.length === 0)
            continue;
        target.resolver = resolver; const config = await target.getConfig();
        const devServer = await createServer({
            ...config,
            base: `/${prefix}/`+target.packageJson.name,
            server: {
                fs: {
                    strict: false
                },
                hmr: {
                    server: app.server,
                },
            },

        });

        app.get(`/${prefix}/${target.packageJson.name}*`, await getTargetMiddleware(devServer, target, prefix));
    }
    app.get(`/${prefix}/`, getNodeModulesMiddleware(process.cwd()));

    await app.listen({
        host: '0.0.0.0',
        port: 9000
    });
    return app;
    // const app = await runDevServer(ufs.use(memfs).use(fs));
    // const {EsmHmrEngine} = await import("snowpack/lib/cjs/hmr-server-engine.js");
    // const hmr = new EsmHmrEngine({
    //     server: app.server,
    // });
    // const devServer = new RspackDevServer(
    //     Object.values(compilers)[0].options.devServer,
    //     compiler)
    // await devServer.initialize();

}