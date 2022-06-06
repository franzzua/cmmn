import {getConfigOptions} from "../bundle/getConfigs.js";
import path from "path";
import fs from "fs";
import liveServer from "live-server";
import {resolve, moduleResolve} from 'import-meta-resolve';

export function serve(...options) {
    const configs = getConfigOptions({
        project: options.includes('-b'),
    });
    configs.filter(x => x.port).forEach(async x => {
        const absRoot = path.join(x.rootDir, x.outDir ?? 'dist/bundle');
        const root = path.relative(process.cwd(), absRoot);
        const server = await liveServer.start({
            root: root,
            file: 'index.html',
            port: x.port,
            open: false,
            mount: x.mount && Object.entries(x.mount)
                .map(([from, to]) => [from, path.resolve(x.rootDir, to)])
                .concat(configs.map(x => [`/external/${x.package}`,
                    path.join(x.rootDir, x.outDir ?? `dist/bundle/${x.name}.js`)])),
            middleware: [resolveESModule(x.rootDir, configs)]
        });

    })

}

function getModuleName(path) {
    if (!path.startsWith('/external/'))
        return null;
    return  path.substring('/external/'.length);
}

const mappingCache = {};

async function getFileName(moduleName, root){
    // console.log(moduleName, root);
    if (moduleName in mappingCache)
        return mappingCache[moduleName];
    const file = (await moduleResolve(moduleName, root, new Set(['module','import', 'browser', 'node'])));
    mappingCache[moduleName] = file.href;
    return file.href;
}

const resolveESModule = (rootDir, configs) => async function (req, res, next) {
    const name = getModuleName(req.url);
    if (!name)
        return next();
    if (configs.some(x => x.package === name))
        return next();
    const referer = req.headers.referer?.substring(req.headers.origin.length);
    const refererModule = referer && getModuleName(referer);
    const root = refererModule
        ? await getFileName(refererModule, 'file://' + rootDir + '/package.json')
        : 'file://' + rootDir + '/package.json';
    try {
        const file = (await getFileName(name, root)).substring('file:///'.length);
        var stat = fs.statSync(file);

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