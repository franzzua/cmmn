import  esbuild from "esbuild";
import {getConfigOptions} from "./getConfigs.js";
import {ConfigCreator} from "./esbuild.config.js";
import fs from "fs";
import path, {relative} from "path";

export async function bundle(...options) {
    const configOptions = getConfigOptions({
        input: options.filter(x => !x.startsWith('-'))[0],
        project: options.includes('-b'),
        minify: options.includes('--prod'),
        devServer: options.includes('--run'),
        stats: options.includes('--stats'),
    });
    const configs = configOptions.flatMap(x => new ConfigCreator(x).getConfig());
    const contexts = await Promise.all(configs.map(async x =>
        [x, await esbuild.context(x)]
    ));

    if (options.includes('--watch')) {
        for (let [name, context] of contexts) {
            await context.watch();
        }
    }else {
        const  logs = [];
        for (let [config, context] of contexts) {
            const result = await context.rebuild();
            const project = path.relative(process.cwd(), config.absWorkingDir);
            const name = config.entryPoints[0].out;
            let log = logs.find(x => x.project === project && x.name === name);
            if (!log){
                logs.push(log = {project, name});
            }
            for (let [name, value] of Object.entries(result.metafile.outputs)) {
                if (!name.endsWith('js')) continue;
                log[config.format+"."+config.platform] = `${(value.bytes/(2**10)).toFixed(1)} Kb`;
            }
            await context.dispose();
        }
        console.table(logs);
    }
}

async function runWatching(configs){
    let counter = 0;
    while(true){
        console.log('Check input existence');
        const missed = await checkMissed(configs);
        if (!missed.length)
            break;
        console.log('missed files:');
        missed.forEach(x => console.log('\t', relative(process.cwd(), x)));
        counter = Math.min(++counter, 5);
        console.log(`wait ${counter} sec...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * counter));
        console.clear();
    }
    const watcher = watch(configs);
    watcher.on('event', (event) => {
        switch (event.code) {
            case 'START':
                console.log(`START BUNDLING at ${new Date().toTimeString().substring(0,8)}`);
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
                    console.log(`\t\t(${event.duration / 1000}s)`);
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
                    case 'UNRESOLVED_ENTRY':
                        console.warn('UNRESOLVED_ENTRY:\t',event.error.message);
                        watcher.close();
                        runWatching(configs);
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

/**
 * @param configs {RollupOptions[]}
 */
async function checkMissed(configs) {
    const missed = [];
    for (let config of configs) {
        for (let key in config.input) {
            try {
                await fs.promises.stat(config.input[key]);
            }catch (e) {
                missed.push(config.input[key]);
            }
        }
    }
    return missed;
}