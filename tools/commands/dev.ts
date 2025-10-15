import {fastify} from "fastify";
import {fastifyCaching} from "@fastify/caching";
import {Flags} from "../model/flags";
import {fastifyCompress} from "../helpers/fastify-compress";
import {Monorepo} from "../model/monorepo";
import {DevServer} from "../servers/dev-server";

export async function dev(flags: Flags) {
    const monorepo = await Monorepo.load(process.cwd());
    const devServer = new DevServer(monorepo);

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
        port: +(monorepo.root.packageJson.config?.port ?? 9000),
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

