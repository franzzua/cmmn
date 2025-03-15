import {Target} from "../helpers/target.js";
import {fastify} from "fastify";
import {DevServer} from "../dev-server/dev-server.js";

export async function dev(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    const devServer = new DevServer(targets);


    const app = fastify({
        rewriteUrl: devServer.rewriteUrl
    });

    await devServer.register(app);

    await app.listen({
        host: '0.0.0.0',
        port: +(targets.at(-1).packageJson.config?.port ?? 9000)
    });

    console.log('listen:\n', app.addresses().map(x => `\t${x.address}:${x.port}`).join('\n'))

    return app;

}

