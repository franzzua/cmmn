import fs from "node:fs/promises";
import {Plugin} from "vite";

export function wasm(options: {
	emitAsset?: boolean
	assetName?: string
} = {}): Plugin{
	return {
		name: 'wasm',
		async load(id) {
			if (!/\.wasm$/.test(id)) return null;
			const name = id.split('/').pop();
			if (options.emitAsset) {
				this.emitFile({
					type: 'asset',
					source: await (this.fs ?? fs).readFile(id),
					name: options.assetName?.replace('{name}', name) ?? 'WASM Asset',
					fileName: name
				});
			}
			return {
				map: {
					mappings: ''
				},
				code: [
					`const url = new URL('./${name}?no-inline', import.meta.url);`,
					`const ab = await fetch(url).then(x => x.arrayBuffer())`,
					`export default new WebAssembly.Module(ab);`
				].join('\n')
			}
		}
	}
};
