import ts from "typescript";
import {pathsToModuleNameMapper} from "ts-jest";

const options = getTSConfig();

export default {
    transform: {
        '^.+\\.tsx?$': ['@swc/jest', {
            jsc: {
                parser: {
                    syntax: "typescript",
                    // tsx: true, // If you use react
                    dynamicImport: true,
                    decorators: true,
                },
                target: "es2021",
                transform: {
                    decoratorMetadata: true,
                },
                paths: options.paths,
                baseUrl: '.'
            },
        }],
    },
    roots: [process.cwd()],
    moduleNameMapper: pathsToModuleNameMapper(options.paths ?? {}, {
        prefix: '<rootDir>'
    }),
    extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx?'],
}


function getTSConfig() {
    const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json');
    const readConfigFileResult = ts.readConfigFile(configPath, ts.sys.readFile);
    if (readConfigFileResult.error) {
        throw new Error(ts.formatDiagnostic(readConfigFileResult.error, formatHost));
    }
    const jsonConfig = readConfigFileResult.config;
    const convertResult = ts.convertCompilerOptionsFromJson(jsonConfig.compilerOptions, './');
    if (convertResult.errors && convertResult.errors.length > 0) {
        throw new Error(ts.formatDiagnostics(convertResult.errors, formatHost));
    }
    const compilerOptions = convertResult.options;
    return compilerOptions;
}