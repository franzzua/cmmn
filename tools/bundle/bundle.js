import  esbuild from "esbuild";
import {getConfigOptions} from "./getConfigs.js";
import {ConfigCreator} from "./esbuild.config.js";
import fs from "fs";
import path, {relative} from "path";

export async function bundle(...options) {
    const configOptions = await getConfigOptions({
        minify: options.includes('--minify'),
        prod: options.includes('--prod'),
        stats: options.includes('--stats'),
    });
    const configs = configOptions.flatMap(x => new ConfigCreator(x).getConfig());
    const contexts = [];
    for (let config of configs){
        contexts.push([config, await esbuild.context(config)]);
    }

    if (options.includes('--watch')) {
        for (let [config, context] of contexts) {
            await context.watch();
        }
        console.log('bundled. Continue watching...');
    }else {
        const  logs = [];
        for (let [config, context] of contexts) {
            const project = path.relative(process.cwd(), config.absWorkingDir);
            const result = await context.rebuild().catch(err => {
                err.message = project + ": " + err.message;
                throw err;
            });
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