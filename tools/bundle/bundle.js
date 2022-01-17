import {getConfig} from "./rollup.config.js";
import {rollup, watch} from "rollup";

export async function bundle(target, ...options) {
    const config = getConfig({
        input: target,
        minify: options.includes('--prop'),
        devServer: options.includes('--run')
    });
    config.onwarn = function (message){

    }
    if (options.includes('--watch')) {
        const watcher = watch(config);
        watcher.on('event', (event) => {
            switch (event.code){
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
                    console.log(`1. ${event.input} -> ${event.output}, (${event.duration/1000}s)`);
                    break;

                case 'ERROR':
                    switch (event.error.code){
                        case 'PARSE_ERROR':
                            console.warn('Error parsing files:');
                            console.log(`\t${event.error.parserError.message}`);
                            console.log(`\tat: ${event.error.id}`);
                            console.log(`\tline: ${event.error.frame}`);
                            break;
                        default:
                            console.warn('Unknown error:', event.error.code);
                            console.log(`\tat: ${event.error.id}`);
                            console.log(`\tline: ${event.error.frame}`);
                            break;
                    }
                    break;
            }
        });
    } else {
        const build = await rollup(config);
    }
}