import ts from "typescript";

export function getTSConfig(directory = process.cwd()) {
    const configPath = ts.findConfigFile(directory, ts.sys.fileExists, 'tsconfig.json');
    const readConfigFileResult = ts.readConfigFile(configPath, ts.sys.readFile);
    if (readConfigFileResult.error) {
        throw readConfigFileResult.error;
    }
    return readConfigFileResult.config;
}

export function getTSCompilerOptions(directory = process.cwd()) {
    const jsonConfig = getTSConfig(directory);
    const convertResult = ts.convertCompilerOptionsFromJson(jsonConfig.compilerOptions, './');
    if (convertResult.errors && convertResult.errors.length > 0) {
        throw convertResult.errors;
    }
    return convertResult.options;
}
