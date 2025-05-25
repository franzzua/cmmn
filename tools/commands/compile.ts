import path from "node:path";
import {swcDir} from "@swc/cli";
import {Target} from "../helpers/target.js";
import {Flags} from "../helpers/flags";
import {FileChangeEvent, Watcher} from "../helpers/watcher";
import events from "node:events";

const rootDir = process.cwd();

export async function compile(flags: Flags) {
	const targets = await Target.readTargets(rootDir, flags);
	events.defaultMaxListeners = Math.max(targets.length * 2, events.defaultMaxListeners);
	const watcher = flags.watch ? new Watcher(targets) : null;
	for (const target of targets) {
		if (target.tsConfig.include?.length === 0)
			continue;
		compileFiles(target);
		watcher?.watchTarget(target);
		target.addEventListener('file', (e: FileChangeEvent) => {
			target.log(`changed: ^W${e.files.join(', ')}`);

			compileFiles(target, e.files.map(f => path.join(target.rootDir, f)));
		});
	}
}

function compileFiles(target: Target, filenames = [target.rootDir]): Promise<void> {
	const swcOptions = target.swcConfig;
	return swcDir({
		cliOptions: {
			outDir: path.join(target.rootDir, './dist/esm'),
			rootDir: path.join(target.rootDir, target.tsConfig.compilerOptions.baseUrl ?? ''),
			extensions: ['.ts', '.js', '.tsx', '.jsx', '.mjs', '.cjs'],
			filenames,
			stripLeadingPaths: target.rootDir !== rootDir,
			quiet: false,
			noSwcrc: true,
			sourceMaps: true,
			logWatchCompilation: true,
			sourceRoot: path.join(target.rootDir, target.tsConfig.compilerOptions.sourceRoot ?? '') + '/',
			ignore: [
				'node_modules/**/*',
				'dist/**/*',
				'specs/*',
				...target.tsConfig.exclude?.map(x => `${x}/**/*`)
			].map(p => path.join(target.rootDir, p))
		},
		swcOptions,
		logWatchCompilation: false,
		callbacks: {
			onSuccess: e => {
				target.log(`compiled for ^W${e.duration.toFixed(0)}ms ^w ${e.compiled} files.`);
			},

			onFail: e => {
				for (let [file, error] of e.reasons) {
					target.error(`${file}\n${error}`)
				}
			},
			// onWatchReady: (e) => {
			//     console.log('watch ready');
			// },
		},
	});
}