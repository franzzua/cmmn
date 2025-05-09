import {Target} from "./target";
import events from "node:events";
import {watch} from "node:fs/promises"
import {throttle} from "throttle-debounce";

export class Watcher {
	abort = new AbortController();

	constructor(private targets: Target[]) {
	}

	async watchTarget(target: Target){
		let changes = new Set<string>();
		const emit = throttle(100, () => {
			target.dispatchEvent(new FileChangeEvent(Array.from(changes)));
			changes.clear();
		}, { debounceMode: true, leading: true, trailing: true });
		for await (let file of watch(target.rootDir, {
			recursive: true,
			signal: this.abort.signal,
			persistent: true
		})) {
			if (file.filename.endsWith('~')
				|| file.filename.startsWith('dist')
				|| file.filename.startsWith('node_modules'))
				continue;
			for (let string of target.tsConfig.exclude) {
			}
			changes.add(file.filename);
			emit();
		}
	}

	[Symbol.dispose](){
		this.abort.abort();
	}
}

export class FileChangeEvent extends Event{
	constructor(public files: string[]) {
		super('file');
	}

}