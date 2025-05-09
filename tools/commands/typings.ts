import ts from "typescript";
import {resolve, relative} from 'node:path';
import fs from "node:fs";
import {tsResolvePlugin} from "../helpers/ts-resolve-plugin.js";
import {Flags} from "../helpers/flags";
import * as process from "node:process";

export function typings(flags: Flags) {

    const rootDir = flags.workspace ? resolve(flags.workspace) : process.cwd();
    const host = ts.createSolutionBuilderWithWatchHost(ts.sys, createProgram);
    host.getCustomTransformers = (pkg) => ({
        before: [
            tsResolvePlugin
        ],
        afterDeclarations: [
            tsResolvePlugin
        ]
    });
    host.useCaseSensitiveFileNames();

    const builderFactory = flags.watch ?
        ts.createSolutionBuilderWithWatch :
        ts.createSolutionBuilder;

    const builder = builderFactory(host, [rootDir], {
        incremental: true,
        dry: false,
        assumeChangesOnlyAffectDirectDependencies: true,
    }, {
        excludeDirectories: ["node_modules", "dist"],
    });
    builder.clean(rootDir);
    builder.build(rootDir);
}

const cleanedBaseDirs = new Set();

function createProgram(rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences) {
    options.outDir = resolve(options.configFilePath, options.outDir ?? '../dist/esm');
    options.declarationDir = resolve(options.configFilePath, options.declarationDir ?? '../dist/typings');
    options.baseUrl = resolve(options.configFilePath, options.baseUrl ?? '.');
    options.tsBuildInfoFile = resolve(options.configFilePath, options.tsBuildInfoFile ?? '../dist/ts.buildinfo');
    options.emitDeclarationsOnly = true;
    // options.excludeDirectories.baseUrl = options.baseUrl;
    // options.includeDirectories.baseUrl = options.baseUrl;
    if (!cleanedBaseDirs.has(options.baseUrl)) {
        fs.rmSync(options.declarationDir, {recursive: true, force: true});
        fs.rmSync(options.tsBuildInfoFile, {force: true});
        cleanedBaseDirs.add(options.baseUrl);
    }
    console.log('\t', relative(process.cwd(), options.baseUrl));
    return ts.createEmitAndSemanticDiagnosticsBuilderProgram(
        rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences
    )
}
