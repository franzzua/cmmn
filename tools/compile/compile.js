import ts from "ttypescript";
import {resolve, relative} from 'path';

const rootDir = process.cwd();

export function compile(...flags) {

    const host = ts.createSolutionBuilderWithWatchHost(ts.sys, createProgram);
    host.useCaseSensitiveFileNames();

    const builderFactory = flags.includes('--watch') ?
        ts.createSolutionBuilderWithWatch :
        ts.createSolutionBuilder;

    const builder = builderFactory(host, [rootDir], {
        incremental: true,
        dry: false,
        assumeChangesOnlyAffectDirectDependencies: true
    }, {
        excludeDirectories: ["node_modules", "dist"],
    });
        builder.clean(rootDir);
        builder.build(rootDir);
}

function createProgram(rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences) {
    options.outDir = resolve(options.configFilePath, '../dist/esm');
    options.declarationDir = resolve(options.configFilePath, '../dist/typings');
    options.baseUrl = resolve(options.configFilePath, '../');
    options.tsBuildInfoFile = resolve(options.configFilePath, '../dist/ts.buildinfo');
    console.log('\t', relative(process.cwd(), options.baseUrl));
    return ts.createEmitAndSemanticDiagnosticsBuilderProgram(
        rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences
    )
}
