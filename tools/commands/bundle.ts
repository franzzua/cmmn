import {Target} from "../helpers/target";
import {Terminal} from "../helpers/terminal.js";
import {Flags} from "../helpers/flags";
import path, {dirname, join} from "node:path";
import {cp, mkdir, stat, writeFile} from "node:fs/promises";
import {ViteBuilder} from "../dev-server/vite.builder";

export async function bundle(flags: Flags) {
	const targets = await Target.readTargets(process.cwd(), flags);
	const term = new Terminal(flags, targets);
	for (let target of targets) {
		const vite = new ViteBuilder(target, null, '');
		const bundle = await vite.getBundle();
		term.setData(target, {
			state: 'ok',
			size: Object.values(bundle).map(x => x.data.length).reduce((a, b) => a + b, 0)
		});
		for (let output of bundle) {
			const path = join(target.rootDir, 'dist/bundle', output.fileName);
			const dir = dirname(path);
			await mkdir(dir, {recursive: true});
			await writeFile(path, output.data,);
			term.term.yellow(`\t\t${output.fileName}\n`)
		}
		await cp(target.publicDir, join(target.rootDir, 'dist/bundle/'), {
			recursive: true
		}).catch(() => {
		});
	}
}

