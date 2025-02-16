import ts from "typescript";
import {resolve, relative} from 'node:path';
import fs from "node:fs";
import {tsResolvePlugin} from "../helpers/ts-resolve-plugin.js";
import {Target} from "../helpers/target.js";

const rootDir = process.cwd();

/**
 * @param flags {import("../helpers/flags.js").Flags}
 */
export async function typings(flags) {
    const targets = await Target.readTargets(rootDir, flags);

    for (let target of targets) {
        runTarget(target, flags);
    }
}

/**
 * @param target {import("../helpers/target.js").Target}
 * @param flags {import("../helpers/flags.js").Flags}
 */
function runTarget(target, flags){

    const host = ts.createIncrementalCompilerHost(ts.sys, createProgram, ()=> {

    }, (a) => {
        console.log(a);
    });
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
        ts.createwa :
        ts.createSolutionBuilder;

    const builder = builderFactory(host, [target.rootDir], {
        incremental: true,
        dry: false,
        assumeChangesOnlyAffectDirectDependencies: true,
        emitDeclarationOnly: true
    }, {
        excludeDirectories: [
            `${target.rootDir}/node_modules`,
            `${target.rootDir}/dist`,
        ]
    });
    builder.clean(target.rootDir);
    builder.build(target.rootDir);

}

const programCache = new Map();


function createProgram(rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences) {
    if (programCache.has(options.configFilePath))
        return programCache.get(options.configFilePath);
    options.outDir = resolve(options.configFilePath, '../dist/esm');
    options.declarationDir = resolve(options.configFilePath, '../dist/typings');
    options.baseUrl = resolve(options.configFilePath, '../');
    options.tsBuildInfoFile = resolve(options.configFilePath, '../dist/ts.buildinfo');
    options.emitDeclarationsOnly = true;
    options.disableReferencedProjectLoad = true;

    fs.rmSync(options.declarationDir, {recursive: true, force: true});
    fs.rmSync(options.tsBuildInfoFile, {force: true});

    console.log(options.project);
    const result = ts.createSemanticDiagnosticsBuilderProgram(
        rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences
    );
    programCache.set(options.configFilePath, result);
    return result;
}