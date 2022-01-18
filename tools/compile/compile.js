import ts from "ttypescript";
import {readFileSync} from "fs";
import {dirname, join, resolve} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = process.cwd();
const configPath = join(__dirname, 'tsconfig.json');
const {config: configJson} = ts.readConfigFile(configPath, path => readFileSync(path, 'utf8'));
function getProjects(dir){

}

export function compile(target, flags) {
    const {options} = ts.convertCompilerOptionsFromJson(configJson.compilerOptions, rootDir);
    // Note that there is another overload for `createWatchCompilerHost` that takes
    // a set of root files.


    const createProgram = (rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences) => {
        options.outDir = resolve(options.configFilePath, '../dist/esm');
        options.declarationDir = resolve(options.configFilePath, '../dist/typings');
        options.baseUrl = resolve(options.configFilePath, '../');
        console.log('build', options.configFilePath);
        return ts.createEmitAndSemanticDiagnosticsBuilderProgram(
            rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences
        )
    };
    const host = ts.createSolutionBuilderWithWatchHost(
        ts.sys,
        createProgram,
    );
    host.useCaseSensitiveFileNames()
    const builder = ts.createSolutionBuilderWithWatch(host, [
        rootDir
    ], {
        incremental: true,
        dry: false
    }, {
        excludeDirectories: ["node_modules", "dist"]
    });
    // builder.cleanReferences(rootDir);
    // builder.buildReferences(rootDir);
    builder.clean(rootDir);
    builder.build(rootDir);
    return;
    // const host = ts.createWatchCompilerHost(
    //     join(rootDir, 'tsconfig.json'),
    //     options,
    //     ts.sys,
    //     createProgram
    // );
    // You can technically override any given hook on the host, though you probably
    // don't need to.
    // Note that we're assuming `origCreateProgram` and `origPostProgramCreate`
    // doesn't use `this` at all.
    const origCreateProgram = host.createProgram;
    // const origPostProgramCreate = host.afterProgramCreate;
    //
    // host.afterProgramCreate = program => {
    //     console.log("** We finished making the program! **");
    //     origPostProgramCreate(program);
    // };

    // `createWatchProgram` creates an initial program, watches files, and updates
    // the program over time.
    host.useCaseSensitiveFileNames()
    ts.createWatchProgram(host);
}
