import ts from "typescript";
import path, {resolve, relative} from 'node:path';
import fs from "node:fs";
import {Flags} from "../model/flags";
import * as process from "node:process";
import {Target} from "../model/target";
import events from "node:events";
import {Watcher} from "../helpers/watcher";
import {Monorepo} from "../model/monorepo";
import {FileChangeEvent} from "../model/pack";

export async function typings(flags: Flags) {
    const monorepo = await Monorepo.load(flags);
    events.setMaxListeners(Math.max(monorepo.targets.length * 2, events.defaultMaxListeners));
    const watcher = flags.watch ? new Watcher() : null;
    for (const target of monorepo.targets) {
        if (target.tsConfig.include?.length === 0)
            continue;
        generateTypings(target);
        if (watcher) {
            watcher.watchTarget(target);
            target.addEventListener('change', (e: FileChangeEvent) => {
                target.log(`changed: ^W${e.files.join(', ')}`);

                generateTypings(target);
            });
        }
    }
}

export function generateTypings(target: Target) {
    const start = performance.now();
    const host = ts.createSolutionBuilderWithWatchHost(ts.sys, createProgram);

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
    builder.build(target.rootDir, null);
    const duration = performance.now() - start;
    target.log(`typings for ^W${duration.toFixed()}ms.`)
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
    return ts.createEmitAndSemanticDiagnosticsBuilderProgram(
        rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences
    )
}
