import {getConfigOptions} from "../bundle/getConfigs.js";
import path from "path";
import fs from "fs";
import liveServer from "live-server";
import {resolve, moduleResolve} from 'import-meta-resolve';
import uri2path from "file-uri-to-path";

export async function serve(...options) {
    const configs = await getConfigOptions({
        project: options.includes('-b'),
    });
    configs.filter(x => x.port).forEach(async (x,i) => {
        const absRoot = path.join(x.rootDir, x.outDir ?? 'dist/bundle');
        const root = path.relative(process.cwd(), absRoot);
        const server = await liveServer.start({
            root: root,
            file: 'index.html',
            port: process.env.PORT ? (+process.env.PORT + i) : x.port,
            open: false,
            watch: configs.map(x => path.join(x.rootDir, x.outDir ?? 'dist/bundle')).join(','),
            mount: x.mount && Object.entries(x.mount)
                .map(([from, to]) => [from, path.resolve(x.rootDir, to)]),
            // .concat(configs.map(x => [`/external/${x.package}`,
            //     path.join(x.rootDir, x.outDir ?? `dist/bundle/${x.name}.js`)])),
            proxy: Object.entries(x.proxy ?? {}),
            middleware: [resolveESModule(x.rootDir, configs)].filter(x => x)
        });

    })

}
function getModuleName(path) {
    if (!path.startsWith('/node_modules/'))
        return null;
    return  path.substring('/node_modules/'.length);
}

const mappingCache = {};

async function resolveModule(module, root){
    const conditions = ['browser', 'main', 'module', 'import', 'node', 'default'];
    for (let condition of conditions) {
        try {
            return moduleResolve(module, root, new Set([condition]), true);
        }catch (e){
        }
    }
    throw new Error(`Failed resolve ${module} from ${root}`);
}
// for resolve modules and files inside modules
async function getFileName(moduleName, root) {
    // console.log(moduleName, root);
    if (moduleName in mappingCache)
        return mappingCache[moduleName];
    let file;
    if (moduleName.match('\.[cm]?js(.map)?$')) {
        const module = moduleName.match(/^(@[^/]+\/)?[^/]+/)[0];
        const main = await resolveModule(module, root);
        const file = main.href.replace(new RegExp('node_modules/' + module + '.*$'), 'node_modules/' + moduleName);
        return mappingCache[moduleName] = file;
    } else {
        console.log(moduleName, root);
        const file = await resolveModule(moduleName, root);
        return mappingCache[moduleName] = file.href;
    }
}
const resolveESModule = (rootDir, configs) => async function (req, res, next) {
    const name = getModuleName(req.url);
    if (!name) {
        return next();
    }
    // if (configs.some(x => x.package === name))
    //     return next();
    const root = 'file://' + process.cwd() + '/package.json';
    try {
        const uri = await getFileName(name, root);
        const file = uri2path(uri);
        const stat = fs.statSync(file);
        const relative = path.relative(rootDir, file).replace(/^.*\/node_modules/, '/node_modules');
        if (req.url !== relative){
            mappingCache[getModuleName(relative)] = uri;
            res.writeHead(302, {
                Location: relative
            });
            res.end();
            return;
        }
        res.writeHead(200, {
            'Content-Type': 'application/javascript',
            'Content-Length': stat.size
        });

        var readStream = fs.createReadStream(file);
        // We replaced all the event handlers with a simple call to readStream.pipe()
        readStream.pipe(res);
        await new Promise(resolve => readStream.on('end', resolve));
        readStream.close();
    } catch (e) {
        console.error(e.message);
        res.writeHead(404, {
            'Content-Type': 'text',
        });
        res.write(e.message);
    }
    res.end();
    return;
}
