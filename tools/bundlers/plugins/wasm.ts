import fs from "node:fs/promises";
import {Plugin} from "vite";
import {dirname, resolve} from "node:path";

export function wasm(options: {
	emitAsset?: boolean
	assetName?: string
} = {}): Plugin{
	return {
		name: 'wasm',
        resolveId(id, importer){
            if (!/\.wasm$/.test(id)) return null;
            const name = id.split('/').pop();
            const moduleInfo = this.getModuleInfo(importer);
            // @ts-ignore
            moduleInfo.dynamicallyImportedIds.push(name);
            // @ts-ignore
            moduleInfo.importedIds.push(name);
            return resolve(dirname(importer), id);
        },
		async load(id) {
			if (!/\.wasm$/.test(id)) return null;
			const name = id.split('/').pop();
            let url =`new URL("./${name}?no-inline", import.meta.url)`;
			if (options.emitAsset) {
                const referenceId = this.emitFile({
					type: 'asset',
					source: await (this.fs ?? fs).readFile(id),
					name: options.assetName?.replace('{name}', name) ?? 'WASM Asset',
					fileName: name,
				});
                url = `import.meta.ROLLUP_FILE_URL_${referenceId}`;
			}
			return {
				map: {
					mappings: ''
				},

				code: [
					`const url = ${url};`,
					`const ab = await fetch(url).then(x => x.arrayBuffer())`,
					`export default new WebAssembly.Module(ab);`
				].join('\n')
			}
		}
	}
};
