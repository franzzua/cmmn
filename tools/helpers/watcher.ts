import {Target} from "../model/target";
import events from "node:events";
import {watch} from "node:fs/promises"
import {throttle} from "throttle-debounce";
import {FileChangeEvent} from "../model/pack";

export class Watcher {
	abort = new AbortController();

	constructor() {
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
			if (file.filename.endsWith('~') || target.isExcluded(file.filename, true))
				continue;
			changes.add(file.filename);
			emit();
		}
	}

	[Symbol.dispose](){
		this.abort.abort();
	}
}
