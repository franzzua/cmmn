import path, {dirname, join} from "node:path";
import {transformFile} from "@swc/core";
import {Target} from "../model/target.js";
import {Flags} from "../model/flags";
import {Watcher} from "../helpers/watcher";
import events from "node:events";
import glob from "fast-glob";
import {mkdir, writeFile} from "node:fs/promises";
import {createWriteStream} from "node:fs";
import {Monorepo} from "../model/monorepo";
import {FileChangeEvent} from "../model/pack";

const rootDir = process.cwd();

export async function compile(flags: Flags) {
	const monorepo = await Monorepo.load(rootDir);
	events.setMaxListeners(Math.max(monorepo.packs.length * 2, events.defaultMaxListeners));
	const watcher = flags.watch ? new Watcher() : null;
	for (const pack of monorepo.targets) {
		if (pack.tsConfig.include?.length === 0)
			continue;
		await compileFiles(pack);
		if (watcher) {
			watcher.watchTarget(pack);
			pack.addEventListener('file', (e: FileChangeEvent) => {
				pack.log(`changed: ^W${e.files.join(', ')}`);
				compileFiles(pack, e.files.map(f => path.join(pack.rootDir, f)));
			});
		}
	}
}

const sourceMapComment = `\n//# sourceMappingURL=`;

async function compileFiles(target: Target, filenames: string[] = null): Promise<void> {
	const swcOptions = target.swcConfig;
	const ignore = target.tsConfig.exclude.flatMap(d => [
		`${target.rootDir}/${d}/**/*`,
		`${target.rootDir}/${d}`,
	]);
	const files = filenames ?? await glob(target.rootDir + '/**/*.[tj]s?(x)', {
		ignore
	});
	const time = performance.now();
	const outDir = join(target.rootDir, 'dist/esm');
	for (let file of files) {
		const result = await transformFile(file, swcOptions);
		const outFile = outDir + file.substring(target.rootDir.length).replace(/\.ts(x?)$/,'.js$1');
		await mkdir(dirname(outFile), { recursive: true});
		const writer = createWriteStream(outFile, { encoding: 'utf8' });
		// const sourceMaps = JSON.parse(result.map)
		// sourceMaps.sources = sourceMaps.sources.map(s => relative(outFile, s))
		// result.map = JSON.stringify(sourceMaps);
		writer.write(result.code);
		writer.write(sourceMapComment);
		writer.write(outFile.split('/').pop()+'.map');
		writer.end();
		await new Promise(r => writer.on('finish', r));
		await writeFile(outFile + '.map', result.map);
	}
	const duration = performance.now() - time;
	target.log(`compiled for ^W${duration.toFixed(0)}ms ^w ${files.length} files`);
}