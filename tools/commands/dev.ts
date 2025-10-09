import {Target} from "../helpers/target";
import {fastify} from "fastify";
import {fastifyCaching} from "@fastify/caching";
import {DevServer} from "../dev-server/dev-server";
import {Flags} from "../helpers/flags";
import {fastifyCompress} from "../helpers/fastify-compress";

export async function dev(flags: Flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    const devServer = new DevServer(targets);

    const app = fastify({
        rewriteUrl: devServer.rewriteUrl,
    });

    if (flags.minify){
        fastifyCompress(app);
        app.register(fastifyCaching as any, {
            privacy: fastifyCaching.privacy.PUBLIC,
            expiresIn: 86400
        })
    }

    await devServer.register(app);

    await app.listen({
        host: '0.0.0.0',
        port: +(targets.at(-1).packageJson.config?.port ?? 9000),
    });

    console.log('listen:\n', app.addresses().map(x => `\t${x.address}:${x.port}`).join('\n'))

    return app;

}
function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on('data', (chunk) => chunks.push(chunk));
        readableStream.on('end', () => resolve(Buffer.concat(chunks)));
        readableStream.on('error', reject);
    });
}

