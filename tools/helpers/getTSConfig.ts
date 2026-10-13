import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

/** tsconfig is JSON with comments and trailing commas */
function readConfigFile(configPath: string) {
	if (!fs.existsSync(configPath)) return null;
	const text = fs.readFileSync(configPath, 'utf-8')
		.replace(/("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (_, str) => str ?? '')
		.replace(/,(\s*[}\]])/g, '$1');
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

export function getTSConfig(configPath: string) {
	const config = readConfigFile(configPath);
	if (!config) {
		return null;
	}
	if (config.extends){
		const extended = getTSConfig(path.resolve(path.dirname(configPath), config.extends)) ??
			getTSConfig(fileURLToPath(import.meta.resolve(config.extends)));
		return withoutConfigDir(merge([extended, config]));
	}
	return withoutConfigDir(config);
}

// include/exclude are used relative to the package dir
function withoutConfigDir(config) {
	for (const key of ['include', 'exclude']) {
		config[key] = config[key]?.map((x: string) => x.replace(/^\$\{configDir\}\/?/, ''));
	}
	return config;
}

export type TypescriptConfig = {
	extends?: string;
	compilerOptions?: Record<string, any>;
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