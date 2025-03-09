import {memfs} from 'memfs';
import {crc32} from "node:zlib";

export class RolldownDependencyBuilder {

    constructor(dependencies, basePath, mode) {
        this.mode = mode;
        this.dependencies = dependencies;
        this.externals = dependencies.map(d =>
            [d, `${basePath}/${d}`]
        );
    }

    async build(target) {
        const {rolldown} = await import('rolldown');
        const build = await rolldown({
            input: target,
            resolve: {
                alias: {
                    ['^react$']: `@id/react`
                },
                // alias: Object.fromEntries(this.externals.filter(x => x[0] !== target))
            },
            external: [
                'react'
            ],
            format: 'esm',
            define: {
                process: JSON.stringify({
                    env: {
                        NODE_ENV: `"${this.mode}"`
                    }
                })
            },
            platform: 'browser',
        });
        const output = await build.generate({
            platform: 'browser',
            esModule: true,
            define: {
                process: JSON.stringify({
                    env: {
                        NODE_ENV: `"${this.mode}"`
                    }
                })
            },
            polyfillRequire: true,
            format: 'esm',
        });
        return output.output.map(x => x.code).join('\n\n')
    }
}

export class EsBuildDependencyBuilder {

    constructor(dependencies, basePath, mode) {
        this.mode = mode;
        this.dependencies = dependencies;
        this.externals = dependencies.map(id =>
            [id, `${basePath}/${id}`]
        );
    }

    canHandle(target) {
        return this.dependencies.some(x => target.startsWith(x));
    }

    async build(target) {
        const esbuild = await import('esbuild');
        const id = crc32(target + new Date());
        const res = await import(target);
        const exports = Object.keys(res);
        const outFile = `/tmp/${id}.js`;
        // fs.writeFileSync(entry, `export {${Object.keys(res).join(',')}} from "${target}";`, {
        //     encoding: 'utf-8'
        // })
        const build = await esbuild.build({
            entryPoints: [target],
            platform: 'browser',
            outfile: outFile,
            alias: Object.fromEntries(this.externals),
            external: this.externals.map(x => x[1]),
            bundle: true,
            target: 'esnext',
            format: 'esm',
            write: false,
            globalName: 'result',
            plugins: []
            // externals: ['react'],
        });
        const result = build.outputFiles.map(x => x.contents)
        return new Blob(result);
    }
}

export class RsPackDependencyBuilder {
    outFile = '/output.js';

    constructor(dependencies, basePath, mode) {
        this.mode = mode;
        this.dependencies = dependencies;
        this.externals = dependencies.map(d =>
            [d, `${basePath}/${d}`]
        );
    }

    async build(target) {
        const {rspack} = await import('@rspack/core');
        const compiler = await rspack({
            entry: target,
            mode: 'none',
            output: {
                library: {
                    type: 'module',
                    export: []
                },
                module: true,
                path: '/',
                filename: this.outFile,
            },
            devtool: false,
            optimization: {
                concatenateModules: true,
                nodeEnv: this.mode ?? 'development',
                avoidEntryIife: true,
                providedExports: true,
                minimize: false,
                removeEmptyChunks: true,
                emitOnErrors: true,
                splitChunks: false,
                mangleExports: 'deterministic',
                innerGraph: true
            },
            target: 'es2022',
            cache: false,
            externals: Object.fromEntries(this.externals.filter(x => x !== target)),
        });
        compiler.outputFileSystem = memfs().fs;
        return await new Promise((resolve, reject) => compiler.run((err, stats) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                const content = compiler.outputFileSystem.readFileSync(this.outFile, {encoding: 'utf-8'})
                    + '\nexport { __webpack_exports__ };';
                resolve(content);
            }
            compiler.close(closeErr => {
                if (closeErr)
                    console.error(closeErr);
            });
        }));
    }
}

export const DependencyBuilder = RsPackDependencyBuilder;