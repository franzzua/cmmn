import ts, {CompilerOptions} from "typescript";
import path from "node:path";
import {fileURLToPath} from "node:url";

export function getTSConfig(configPath: string) {
	const result = ts.readConfigFile(configPath, ts.sys.readFile);
	if (result.error) {
		return null;
	}
	if (result.config.extends){
		const extended = getTSConfig(path.resolve(path.dirname(configPath), result.config.extends)) ??
			getTSConfig(fileURLToPath(import.meta.resolve(result.config.extends)));
		const merged = merge([extended, result.config]);
		return  merged;
	}
	return result.config;
}

export type TypescriptConfig = {
	extends?: string;
	compilerOptions?: CompilerOptions;
	exclude?: string[];
	include?: string[];
	references?: Array<{ path: string; }>
}

function merge(values: object[]){
	const keys = new Set(values.flatMap(Object.keys));
	const result = {};
	for (let key of keys) {
		const v = values.map(x => x[key as any]).filter(x => x !== undefined);
		if (v.length === 0)
			result[key as any] = undefined;
		else if (v.length === 1)
			result[key as any] = v[0];
		else if (typeof v.at(-1) !== "object" || v.at(-1) === null || Array.isArray(v.at(-1)))
			result[key as any] = v.at(-1)
		else
			result[key as any] = merge(v);
	}
	return result;
}