import path from "node:path";
import {swcDir} from "@swc/cli";
import {Target} from "../helpers/target.js";

const rootDir = process.cwd();

/**
 * @param flags {import("../helpers/flags.js").Flags}
 * @returns {Promise<import('@swc/types').Config>}
 */
export async function compile(flags) {
    for (const target of await Target.readTargets(rootDir, flags)) {
        if (target.tsConfig.include?.length === 0)
            continue;
        const swcOptions = target.swcConfig;
        const app = path.relative(rootDir, target.rootDir);
        swcDir({
            cliOptions: {
                outDir: path.join(target.rootDir, './dist/esm'),
                rootDir: path.join(target.rootDir, target.tsConfig.compilerOptions.baseUrl ?? ''),
                watch: flags.watch,
                extensions: ['.ts', '.js', '.tsx', '.jsx', '.mjs', '.cjs'],
                // filenames: swcOptions.env.include.map(s => path.join(rootDir, s)),
                filenames: swcOptions.env?.include?.length === 0 ? [] : [path.join(target.rootDir, './')],
                stripLeadingPaths: true,
                quiet: false,
                noSwcrc: true,
                sourceMaps: true,
                logWatchCompilation: true,
                sourceRoot: path.join(target.rootDir, target.tsConfig.compilerOptions.sourceRoot ?? '') + '/',
                ignore: [
                    'node_modules/**/*',
                    'dist/**/*',
                    'specs/*'
                ].map(p => path.join(target.rootDir, p))
            },
            swcOptions,
            callbacks: {
                onSuccess: e => {
                    target.log(`compiled for ^W${e.duration.toFixed(0)}ms ^w ${e.compiled} files.`);
                },
                onFail: console.log,
                onWatchReady: (e) => {
                    console.log('watch ready');
                },
            },
        });
    }
}
