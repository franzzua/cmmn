import {Target} from "../helpers/target.js";
import {fastify} from "fastify";
import {DevServer} from "../dev-server/dev-server.js";

const prefix = '_';
const url = 'http://localhost:9000';

export async function dev(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    const devServer = new DevServer(targets);


    const app = fastify({
        rewriteUrl: devServer.rewriteUrl
    });

    await devServer.register(app);

    const url = await app.listen({
        host: '0.0.0.0',
        port: 9000
    });

    console.log('listen:\n', app.addresses().map(x => `\t${x.address}:${x.port}`).join('\n'))

    return app;

}

