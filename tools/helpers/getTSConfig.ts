import ts, {CompilerOptions} from "typescript";

export function getTSConfig(directory = process.cwd()) {
	const configPath = ts.findConfigFile(directory, ts.sys.fileExists, 'tsconfig.json');
	const readConfigFileResult = ts.readConfigFile(configPath, ts.sys.readFile);
	if (readConfigFileResult.error) {
		throw null;
	}
	return readConfigFileResult.config;
}

export type TypescriptConfig = {
	extends?: string;
	compilerOptions?: CompilerOptions;
	exclude?: string[];
	include?: string[];
	references?: Array<{ path: string; }>
}