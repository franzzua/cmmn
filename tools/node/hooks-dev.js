import {Target} from "../helpers/target.js";
import {Flags} from "../helpers/flags.js";
import {join} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const targets = await Target.readTargets(process.cwd(), new Flags(''));
const serverUrl = 'http://127.0.0.1:9000/_/';

export async function resolve(specifier, context, nextResolve){
    context.parentURL = urlToFile(context.parentURL);
    if (specifier.startsWith('http://127.0.0.1:9000/_/@id/'))
        return nextResolve(specifier.substr('http://127.0.0.1:9000/_/@id/'.length), context, nextResolve);
    if (specifier.startsWith('/_/@id/'))
        return nextResolve(specifier.substr('/_/@id/'.length), context, nextResolve);
    if (specifier.startsWith('/_/')){
        return {
            shortCircuit: true,
            url: serverUrl + specifier.substr('/_/'.length)
        };
    }
    for (let target of targets) {
        if (specifier.startsWith(target.packageJson.name)) {
            return {
                shortCircuit: true,
                url: serverUrl + specifier
            };
        }
    }
    return nextResolve(specifier, context, nextResolve);
}

function urlToFile(url){
    if (!url?.startsWith(serverUrl)) return url;
    const path = url.substr(serverUrl.length);
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
    if (url.startsWith('http://')) {
        const content = await fetch(url).then(x => x.text());
        return {
            shortCircuit: true,
            source: content,
            format: 'module'
        }
    }

    // Let Node.js handle all other URLs.
    return defaultLoad(url, context, defaultLoad);
}