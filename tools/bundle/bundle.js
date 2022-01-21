import {ConfigCreator} from "./rollup.config.js";
import {rollup, watch} from "rollup";
import fs from "fs";
import path from "path";
import fg from "fast-glob";

function getProjectConfig(rootDir, cmmn, options) {
    const configCreator = new ConfigCreator({
        ...options,
        ...cmmn,
    });
    configCreator.setRootDir(rootDir);
    return configCreator.getConfig();
}

function getPackageConfigs(rootDir, options, name = null) {
    const results = [];
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json')));
    if (name) {
        results.push(...getProjectConfig(rootDir, pkg.cmmn[name], {
            ...options,
            name
        }));
    } else {
        for (let name in pkg.cmmn) {
            results.push(...getProjectConfig(rootDir, pkg.cmmn[name], {
                ...options,
                name
            }));
        }
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
    if (!options.input || options.project) {
        const rootDir = process.cwd();
        const lernaPath = path.join(rootDir, 'lerna.json');
        if (fs.existsSync(lernaPath)) {
            return getLernaSubPackages(lernaPath, options);
        }
        return getPackageConfigs(process.cwd(), options);
    }
    if (options.input && !fs.existsSync(options.input)) {
        return getPackageConfigs(process.cwd(), options, options.input);
    }
    const creator = new ConfigCreator(options);
    return creator.getConfig();
}

export async function bundle(...options) {
    const configs = getConfigs({
        input: options.filter(x => !x.startsWith('-'))[0],
        project: options.includes('-b'),
        minify: options.includes('--prod'),
        devServer: options.includes('--run'),
        stats: options.includes('--stats'),
    });
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
