import ts, {CompilerOptions} from "typescript";
import {mergeConfig} from "vite"
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
		return mergeConfig(extended, result.config);
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