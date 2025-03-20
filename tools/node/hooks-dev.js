import {Target} from "../helpers/target.js";
import {Flags} from "../helpers/flags.js";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const targets = await Target.readTargets(process.cwd(), new Flags(''));
const serverUrl = 'http://127.0.0.1:9000';
const base = '/_/';

export async function resolve(specifier, context, nextResolve){
    context.parentURL = urlToFile(context.parentURL);
    if (specifier.startsWith(serverUrl))
        specifier = specifier.substr(serverUrl.length);
    if (specifier.startsWith('/_/@id/'))
        return nextResolve(specifier.substr('/_/@id/'.length), context, nextResolve);
    if (specifier.startsWith('/_/')){
        return {
            shortCircuit: true,
            url: serverUrl + base + specifier.substr('/_/'.length)
        };
    }
    for (let target of targets) {
        if (specifier.startsWith(target.packageJson.name)) {
            return {
                shortCircuit: true,
                url: serverUrl + base + specifier
            };
        }
    }
    return nextResolve(specifier, context, nextResolve);
}

function urlToFile(url){
    if (!url?.startsWith(serverUrl)) return url;
    const path = url.substr(serverUrl.length + base.length);
    for (let target of targets) {
        if (path.startsWith(target.packageJson.name)){
            const localPath = path.substr(target.packageJson.name);
            return pathToFileURL(target.entries[localPath + '.'] ?? join(target.rootDir, localPath));
        }
    }
    if (path.startsWith('@id/'))
        return path.substr('@id/'.length);
}


export async function load(url, context, defaultLoad) {
    // For JavaScript to be loaded over the network, we need to fetch and
    // return it.
    if (url.startsWith(serverUrl)) {
        return {
            shortCircuit: true,
            source: await fetch(url).then(x => x.text()),
            format: 'module'
        }
    }

    // Let Node.js handle all other URLs.
    return defaultLoad(url, context, defaultLoad);
}