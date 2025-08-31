import url from "url";
import fs from "node:fs/promises";

export const wasmResolver = {
	name: 'wasm-resolver',
	setup(r) {
		r.onResolve({filter: /\.(?:wasm)$/}, o => {
			const resolved = new URL(o.path, url.pathToFileURL(o.importer));
			return {
				path: url.fileURLToPath(resolved),
				namespace: 'wasm-module'
			}
		})
		r.onLoad({
			filter: /.*/,
			namespace: 'wasm-module'
		}, async o => ({
			contents: await fs.readFile(o.path),
			loader: "file"
		}))
	}
};