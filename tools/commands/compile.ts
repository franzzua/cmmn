import path, {dirname, join, relative} from "node:path";
import {transformFile} from "@swc/core";
import {Target} from "../helpers/target.js";
import {Flags} from "../helpers/flags";
import {FileChangeEvent, Watcher} from "../helpers/watcher";
import events from "node:events";
import glob from "fast-glob";
import {mkdir, writeFile} from "node:fs/promises";
import {createWriteStream} from "node:fs";

const rootDir = process.cwd();

export async function compile(flags: Flags) {
	const targets = await Target.readTargets(rootDir, flags);
	events.setMaxListeners(Math.max(targets.length * 2, events.defaultMaxListeners));
	const watcher = flags.watch ? new Watcher() : null;
	for (const target of targets) {
		if (target.tsConfig.include?.length === 0)
			continue;
		await compileFiles(target);
		if (watcher) {
			watcher.watchTarget(target);
			target.addEventListener('file', (e: FileChangeEvent) => {
				target.log(`changed: ^W${e.files.join(', ')}`);
				compileFiles(target, e.files.map(f => path.join(target.rootDir, f)));
			});
		}
	}
}

const sourceMapDataUrl = `data:application/json;charset=utf-8;base64,`;
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