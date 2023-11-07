import {pathsToModuleNameMapper} from "ts-jest";
import {getTSCompilerOptions} from "../helpers/getTSConfig.js";

const options = getTSCompilerOptions(process.cwd());

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
                baseUrl: process.cwd()
            },
        }],
    },
    roots: [process.cwd()],
    moduleNameMapper: pathsToModuleNameMapper(options.paths ?? {}, {
        prefix: '<rootDir>'
    }),
    extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx?'],
}


