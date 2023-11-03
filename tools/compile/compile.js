import ts from "typescript";
import {resolve, relative} from 'node:path';
import fs from "node:fs";
import { tsResolvePlugin } from "./ts-resolve-plugin.js";

const rootDir = process.cwd();

export function compile(...flags) {

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
const cleanedBaseDirs = new Set();
function createProgram(rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences) {
    options.outDir = resolve(options.configFilePath, '../dist/esm');
    options.declarationDir = resolve(options.configFilePath, '../dist/typings');
    options.baseUrl = resolve(options.configFilePath, '../');
    options.tsBuildInfoFile = resolve(options.configFilePath, '../dist/ts.buildinfo');
    if (!cleanedBaseDirs.has(options.baseUrl)){
        fs.rmSync(options.outDir, {recursive: true, force: true});
        fs.rmSync(options.declarationDir, {recursive: true, force: true});
        fs.rmSync(options.tsBuildInfoFile, {force: true});
        cleanedBaseDirs.add(options.baseUrl);
    }
    console.log('\t', relative(process.cwd(), options.baseUrl));
    return ts.createEmitAndSemanticDiagnosticsBuilderProgram(
        rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences
    )
}
