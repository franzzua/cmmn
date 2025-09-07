import ts from "typescript";
import path, {resolve, relative} from 'node:path';
import fs from "node:fs";
import {tsResolvePlugin} from "../helpers/ts-resolve-plugin.js";
import {Flags} from "../helpers/flags";
import * as process from "node:process";
import {Target} from "../helpers/target";
import events from "node:events";
import {FileChangeEvent, Watcher} from "../helpers/watcher";
const rootDir = process.cwd();

export async function typings(flags: Flags) {
    const targets = await Target.readTargets(rootDir, flags);
    events.defaultMaxListeners = Math.max(targets.length * 2, events.defaultMaxListeners);
    const watcher = flags.watch ? new Watcher() : null;
    for (const target of targets) {
        if (target.tsConfig.include?.length === 0)
            continue;
        generateTypings(target);
        watcher?.watchTarget(target);
        target.addEventListener('file', (e: FileChangeEvent) => {
            target.log(`changed: ^W${e.files.join(', ')}`);

            generateTypings(target, e.files.map(f => path.join(target.rootDir, f)));
        });
    }
}

export function generateTypings(target: Target, files: string[] = []) {

    const host = ts.createSolutionBuilderWithWatchHost(ts.sys, createProgram);
    // host.getCustomTransformers = (pkg) => ({
    //     before: [
    //         tsResolvePlugin
    //     ],
    //     afterDeclarations: [
    //         tsResolvePlugin
    //     ]
    // });
    host.useCaseSensitiveFileNames();

    const builder = ts.createSolutionBuilder(host, [target.rootDir], {
        incremental: false,
        dry: false,
        assumeChangesOnlyAffectDirectDependencies: true,
        declaration: true,
        declarationMap: false,
        emitDeclarationOnly: true,
        force: true,
    });
    builder.clean(target.rootDir);
    builder.build(target.rootDir);
}

const cleanedBaseDirs = new Set();

function createProgram(rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences) {
    options.outDir = resolve(options.configFilePath, options.outDir ?? '../dist/esm');
    options.declaration = true;
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
