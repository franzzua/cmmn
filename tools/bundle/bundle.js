import {rollup, watch} from "rollup";
import {getConfigOptions} from "./getConfigs.js";
import {ConfigCreator} from "./rollup.config.js";
import fs from "fs";
import path from "path";

export async function bundle(...options) {
    const configOptions = getConfigOptions({
        input: options.filter(x => !x.startsWith('-'))[0],
        project: options.includes('-b'),
        minify: options.includes('--prod'),
        devServer: options.includes('--run'),
        stats: options.includes('--stats'),
    });
    const configs = configOptions.flatMap(x => new ConfigCreator(x).getConfig());
    if (!options.includes('--watch')) {
        for (let config of configs) {
            for (let key in config.input){
                // console.log(`1. ${key} (${config.input[key]})`);
            }
            const build = await rollup(config);
            for (let out of config.output){
                const file = path.join(out.dir, out.entryFileNames.replace('[name]', Object.keys(config.input)[0]));
                 await build.write(out);
                const stat = fs.existsSync(file) ? fs.statSync(file) : 0;
                console.log(`SUCCESS: ${file} (${(stat.size/1024).toFixed(0)} Kb)`);

            }
        }
        return;
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
