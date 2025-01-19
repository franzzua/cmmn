import path from "path";
import * as realFs from "fs";
import {fastify} from "fastify";
import mime from "mime";
import {fileURLToPath, pathToFileURL} from "node:url";
import {resolve, moduleResolve} from 'import-meta-resolve';

/**
 * @param fs {import('fs')}
 */
export async function runDevServer(fs) {
    const app = fastify({});
    // for (let path in compilers) {
    //     app.register(route(compilers[path]), {prefix: '/_/' + path});
    // }
    app.get('/_/*', async (req, reply) => {
        const file = req.params['*'];
        const resolvedUrl = resolve(file, pathToFileURL(process.cwd()+"/index.js"));
        const type = mime.lookup(resolvedUrl);
        return reply.type(type).send(await fs.promises.readFile(fileURLToPath(resolvedUrl)));
    });
    await app.listen({
        host: '0.0.0.0',
        port: 9000
    });
    return app;
}

/**
 * @param compiler {import('@rspack/core').Compiler}
 * @returns {(function(app: import('fastify/types/instance.js').FastifyInstance, *): Promise<void>)|*}
 */
export function route(compiler) {
    let compilation;

    async function getFile(file, fromCompilation) {
        if (fromCompilation) {
            compilation ??= new Promise((resolve) => compiler.watch({}, () => {
                resolve();
            }));
            await compilation;
        }
        const fs = fromCompilation ? compiler.outputFileSystem : realFs;
        return new Promise((resolve, reject) => {
            fs.readFile(path.join(compiler.options.context, file), (err, buf) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(buf);
                }
            });
        });
    }

    /**
     * @param app {import('fastify/types/instance.js').FastifyInstance}
     */
    return async (app, opts) => {
        app.get('/', async (req, res) => {
            return getFile('dist/bundle/index.js', true)
        });
        app.get('/*', (request) => {
            return getFile(request.params['*'], false)
        });
    }
}