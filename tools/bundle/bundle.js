import {getConfig} from "./rollup.config.js";
import {rollup, watch} from "rollup";

export async function bundle(target, ...options) {
    const config = getConfig({
        input: target,
        minify: options.includes('--prop'),
        devServer: options.includes('--run')
    });
    if (options.includes('--watch')) {
        watch(config).on('change', (id, opts) => {
        });
    } else {
        const build = await rollup(config);
    }
}