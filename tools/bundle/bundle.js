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
    const pckPath = path.join(rootDir, 'package.json');
    if (!fs.existsSync(pckPath))
        return [];
    const results = [];
    const pkg = JSON.parse(fs.readFileSync(pckPath));
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
    if (!options.input.includes('.') || !fs.existsSync(options.input)) {
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
            for (let key in config.input){
                // console.log(`1. ${key} (${config.input[key]})`);
            }
            const build = await rollup(config);
            for (let out of config.output){
                console.log(`SUCCESS: ${out.dir} ${out.entryFileNames.replace('[name]', Object.keys(config.input)[0])}`);
                await build.write(out);
            }
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
                console.log(`FINISH at ${new Date().toTimeString().substring(0,8)}`);
                break;
            case 'BUNDLE_START':
                for (let key in event.input){
                    console.log(`\t${key} -> ${event.output}`);
                }
                break;
            case 'BUNDLE_END':
                for (let key in event.input){
                    console.log(`\t${key} -> ${event.output}, (${event.duration / 1000}s)`);
                }
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
                        console.warn('UNRESOLVED_IMPORT:\t',event.error.message);
                        break;
                    case 'MISSING_EXPORT':
                        console.warn('MISSING_EXPORT: \t', event.error.message);
                        break;
                    default:
                        console.warn('Unknown error:', event.error.code);
                        console.error(event.error);
                        break;
                }
                break;
            default:
                console.warn('WARNING:', event)
        }
    });
}
