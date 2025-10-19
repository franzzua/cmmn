import {Terminal} from "../helpers/terminal.js";
import {Flags} from "../model/flags";
import {dirname, join} from "node:path";
import {cp, mkdir, writeFile, link, rm} from "node:fs/promises";
import {Monorepo} from "../model/monorepo";
import {createBundler} from "../bundlers/createBundler";
import {Target} from "../model/target";
import {gzipSync, brotliCompressSync} from "node:zlib";

export async function deploy(flags: Flags) {
	const monorepo = await Monorepo.load(process.cwd());
	const term = new Terminal(flags, monorepo.packs);
    const outRoot = flags.deploy
        ? join(monorepo.root.rootDir, flags.out, 'web')
        : '';
    if(flags.deploy) {
        await rm(outRoot, {recursive: true, force: true}).catch(err => {
            console.error(err);
        });
    }
	for (let pack of monorepo.packs.values()) {
        if (flags.workspace && !(
            pack.name.match(new RegExp(flags.workspace))
            || pack.name == flags.workspace
        ))
            continue;
        if (!flags.deploy && !(pack instanceof Target))
            continue;
        const outDir = flags.deploy
            ? join(outRoot, pack.publicPath)
            : join(pack.rootDir, 'dist/bundle');
        const bundler = createBundler(pack, flags.deploy ? monorepo.resolver : null);
        const bundle = await bundler.bundle();
        let size = 0;
        for (let file of bundle.fileNames()) {
            const path = join(outDir, file);
            const dir = dirname(path);
            await mkdir(dir, {recursive: true});
            const data = bundle.get(file);
            await writeFileWithSidecar(path, data);
            size += data.length;
            // term.term.yellow(`\t\t${file}\n`)
        }
        if (flags.deploy) {
            const manifest = await bundle.getBundleJson();
            await writeFileWithSidecar(join(outDir, 'bundle.json'), JSON.stringify(manifest, null, 2));
            if (pack.name === '@cmmn/service-worker'){
                await writeFileWithSidecar(join(outRoot, '_sw.js'), bundle.get('worker.js'))
            }
        }
        term.setData(pack, {
            state: 'ok',
            size: size
        });
        if (pack instanceof Target)
            await cp(pack.publicDir, outDir, {
                recursive: true
            }).catch(() => {});
	}
}

async function writeFileWithSidecar(path, data){
    await writeFile(path, data);
    if (Flags.Current.args.includes('--gzip'))
        await writeFile(path+'.gz', gzipSync(data));
    if (Flags.Current.args.includes('--brotli'))
        await writeFile(path+'.br', brotliCompressSync(data));
}
