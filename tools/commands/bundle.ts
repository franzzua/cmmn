import {Terminal} from "../helpers/terminal.js";
import {Flags} from "../model/flags";
import {dirname, join} from "node:path";
import {cp, mkdir, writeFile} from "node:fs/promises";
import {Monorepo} from "../model/monorepo";
import {ViteBundler} from "../bundlers/vite.bundler";

export async function bundle(flags: Flags) {
	const monorepo = await Monorepo.load(process.cwd());
	const term = new Terminal(flags, monorepo.packs);
	for (let target of monorepo.targets) {
        const vite = new ViteBundler(target, null);
        const bundle = await vite.bundle();
        let size = 0;
        for (let file of bundle.fileNames()) {
            const path = join(target.rootDir, 'dist/bundle', file);
            const dir = dirname(path);
            await mkdir(dir, {recursive: true});
            const data = bundle.get(file);
            await writeFile(path, data);
            size += data.length;
            // term.term.yellow(`\t\t${file}\n`)
        }
        term.setData(target, {
            state: 'ok',
            size: size
        });
        await cp(target.publicDir, join(target.rootDir, 'dist/bundle/'), {
            recursive: true
        }).catch(() => {});
	}
}

