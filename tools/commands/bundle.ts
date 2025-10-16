import {Terminal} from "../helpers/terminal.js";
import {Flags} from "../model/flags";
import {dirname, join} from "node:path";
import {cp, mkdir, writeFile} from "node:fs/promises";
import {Monorepo} from "../model/monorepo";
import {ViteBundler} from "../bundlers/vite.bundler";
import {createBundler} from "../bundlers/createBundler";
import {Target} from "../model/target";

export async function bundle(flags: Flags) {
	const monorepo = await Monorepo.load(process.cwd());
	const term = new Terminal(flags, monorepo.packs);
	for (let pack of monorepo.packs.values()) {
        if (!flags.deploy && !(pack instanceof Target))
            continue;
        if (pack.isServer)
            continue;
        const outDir = flags.deploy
            ? join(monorepo.root.rootDir, flags.out, pack.publicPath)
            : join(pack.rootDir, 'dist/bundle');
        console.log(outDir);
        const bundler = createBundler(pack, flags.deploy ? monorepo.resolver : null);
        const bundle = await bundler.bundle();
        let size = 0;
        for (let file of bundle.fileNames()) {
            const path = join(outDir, file);
            const dir = dirname(path);
            await mkdir(dir, {recursive: true});
            const data = bundle.get(file);
            await writeFile(path, data);
            size += data.length;
            // term.term.yellow(`\t\t${file}\n`)
        }
        if (flags.deploy) {
            const manifest = await bundle.getBundleJson();
            await writeFile(join(outDir, 'bundle.json'), JSON.stringify(manifest, null, 2));
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

