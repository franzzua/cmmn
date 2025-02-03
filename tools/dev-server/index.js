import fs from "fs/promises";
import mime from "mime";
import {fileURLToPath, pathToFileURL} from "node:url";
import {resolve, moduleResolve} from 'import-meta-resolve';
import {createServer} from "vite";
import path from "path";

/**
 * @param rootDir {string}
 */
export function getNodeModulesMiddleware(rootDir) {
    return async (req, reply) => {
        const file = req.params['*'];
        const resolvedUrl = resolve(file, pathToFileURL(rootDir+"/index.js"));
        const type = mime.getType(resolvedUrl);
        return reply.type(type).send(await fs.readFile(fileURLToPath(resolvedUrl)));
    };
}

/**
 * @param devServer {import('vite/dist/node/index.d.ts').ViteDevServer}
 * @param target {import("../helpers/target.js").Target}
 * @param prefix {string}
 * @returns {Promise<function(*, *, *): Promise<string | undefined | Buffer>>}
 */
export async function getTargetMiddleware(devServer, target, prefix) {
    let clientInjected = false;
    /**
     * @param req {import('fastify/types/request.js').FastifyRequest}
     * @param res {import('fastify/types/reply.js').FastifyReply}
     * @returns {Promise<string | undefined | Buffer>}
     */
    async function handler(req, res){
        const route = req.params['*'];
        const file = route || '/index.ts'
        if (file.startsWith(`/${prefix}`)){
            res.status(302);
            res.headers({
                location: file
            });
            return;
        }
        if (file.endsWith('.html')){
            const content = await fs.readFile(path.join(target.rootDir, file), {
                encoding: 'utf-8'
            });
            const mimeType = mime.getType(file)
            res.headers({
                "content-type": mimeType
            });
            if (file.endsWith('.html')) {
                clientInjected = true;
            }
            return devServer.transformIndexHtml(file, content);
        }
        if (file.match(/\.[tj]sx?$/) || !file.match(/\.(css|png|svg|jpe?g)$/)) {
            res.headers({
                "content-type": "application/javascript"
            });
            const result = await devServer.transformRequest(file);
            if (!clientInjected) {
                return result.code + `
                // inject vite client
                import "/${prefix}/${target.packageJson.name}/@vite/client";
            `;
            }
            return result.code;
        }
        res.headers({
            "content-type": mime.getType(file)
        });
        return fs.readFile(path.join(target.rootDir, file));
    };
    return handler;
}