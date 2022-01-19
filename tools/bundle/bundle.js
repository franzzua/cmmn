import {getConfig} from "./rollup.config.js";
import {rollup, watch} from "rollup";
import fs from "fs";
import path from "path";
import fg from "fast-glob";

function getPackageConfigs(rootDir, options) {
    const results = [];
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json')));
    for (let name in pkg.cmmn) {
        results.push(...getConfig({
            name,
            outDir: path.join(rootDir, pkg.cmmn[name].output ?? 'dist'),
            input: path.join(rootDir, pkg.cmmn[name].input ?? 'index.ts'),
            minify: options.includes('--prod'),
            devServer: options.includes('--run'),
            stats: options.includes('--stats'),
            module: pkg.cmmn[name].module ?? 'es'
        }))
    }
    return results;
}

function getLernaSubPackages(lernaFile, options) {
    const config = JSON.parse(fs.readFileSync(lernaFile, 'utf8'));
    const packages = config.packages;
    const dirs = packages.flatMap(pkg => fg.sync([pkg], {
        absolute: true,
        globstar: true,
        onlyDirectories: true,
        cwd: path.dirname(lernaFile)
    }));
    return dirs.flatMap(dir => getPackageConfigs(dir, options));
}

function getConfigs(options) {
    if (options.includes('-b')) {
        const rootDir = process.cwd();
        const lernaPath = path.join(rootDir, 'lerna.json');
        if (fs.existsSync(lernaPath)) {
            return getLernaSubPackages(lernaPath, options);
        }
    }
    const input = options.filter(x => !x.startsWith('-'))[0];
    return getConfig({
        input,
        minify: options.includes('--prod'),
        devServer: options.includes('--run'),
        stats: options.includes('--stats'),
        module: 'es'
    });
}

export async function bundle(...options) {
    const configs = getConfigs(options);
    if (!options.includes('--watch')) {
        for (let config of configs) {
            console.log(`1. ${config.input} -> ${config.output.file}`);
            const build = await rollup(config);
            await build.write(config.output);
            console.log('SUCCESS');
        }
        return;
    }
    const watcher = watch(configs);
    watcher.on('event', (event) => {
        switch (event.code) {
            case 'START':
                console.clear();
                console.log('START BUNDLING');
                break;
            case 'END':
                console.log('FINISH');
                break;
            case 'BUNDLE_START':
                console.log(`1. ${event.input} -> ${event.output}`);
                break;
            case 'BUNDLE_END':
                console.log(`1. ${event.input} -> ${event.output}, (${event.duration / 1000}s)`);
                break;

            case 'ERROR':
                switch (event.error.code) {
                    case 'PARSE_ERROR':
                        console.warn('Error parsing files:');
                        console.log(`\t${event.error.parserError.message}`);
                        console.log(`\tat: ${event.error.id}`);
                        console.log(`\tline: ${event.error.frame}`);
                        break;
                    case 'UNRESOLVED_IMPORT':
                        console.error(event.error.message);
                        break;
                    default:
                        console.warn('Unknown error:', event.error.code);
                        console.error(event.error);
                        break;
                }
                break;
        }
    });
}
