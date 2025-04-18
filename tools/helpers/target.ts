import {getDependencyOrder} from "./getProjects.js";
import path, {join, relative, resolve} from "node:path";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {getTSConfig, TypescriptConfig} from "./getTSConfig.js";
import terminalKit from "terminal-kit";
import {Flags} from "./flags";
import {JSONSchemaForNPMPackageJsonFiles} from "@schemastore/package";
import {CompilerOptions} from "typescript";
import {Config} from "@swc/core";

const swcConfig = JSON.parse(await fs.promises.readFile(fileURLToPath(import.meta.resolve('@cmmn/tools/swcrc')), {
    encoding: 'utf-8'
}));

export class Target extends EventTarget {
    rootDir: string;
    flags: Flags;
    deps: Target[];
    reactions: Target[] = [];
    depsMap: Map<string, Target>;

    constructor(rootDir: string, flags: Flags, deps: Target[]) {
        super();
        this.rootDir = rootDir;
        this.flags = flags;
        this.deps = deps;
        this.depsMap = new Map(deps.map(x => [x.packageJson.name, x]));
        for (let dep of this.deps) {
            dep.addEventListener('change', e => this.dispatchEvent(new ChangeEvent(e.payload, e.from)));
            dep.reactions.push(this)
        }
    }

    static async readTargets(rootDir: string, flags: Flags): Promise<Target[]> {
        if (flags.workspace) {
            return [new Target(resolve(rootDir, flags.workspace), flags, [])];
        }
        const result = new Map();
        for await (let project of getDependencyOrder(rootDir)) {
            const depProjects = project.deps.map(x => result.get(x));
            result.set(project.root, new Target(project.root, flags, depProjects));
        }
        return Array.from(result.values());
    }

    _packageJson: JSONSchemaForNPMPackageJsonFiles;
    get packageJson(): JSONSchemaForNPMPackageJsonFiles {
        const pkgPath = path.join(this.rootDir, 'package.json');
        return this._packageJson ??= JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    }

    get externalDependencies() {
        return [
            ...Object.keys(this.packageJson.dependencies ?? {}),
            ...Object.keys(this.flags.production ? {} : this.packageJson.devDependencies ?? {}),
        ]
    }

    _tsConfig: TypescriptConfig;
    get tsConfig(): TypescriptConfig {
        return this._tsConfig ??= getTSConfig(this.rootDir);
    }

    _swcConfig: Config;
    get swcConfig(): Config {
        const tsConfig = this.tsConfig;
        return this._swcConfig ??= {
            ...swcConfig,
            jsc: {
                ...swcConfig.jsc,
                baseUrl: this.rootDir,
                paths: tsConfig.compilerOptions?.paths,
                minify: this.flags.minify ? {
                    compress: {
                        booleans_as_integers: true,
                        ecma: 2020
                    },
                    mangle: {
                        topLevel: true
                    },
                    ecma: '2020',
                    format: {
                        comments: false,
                        asciiOnly: true
                    }
                } : undefined
            },
            module: {
                type: 'es6',
                strict: true,
                strictMode: false,

                resolveFully: true
            },
            sourceMaps: true,
            inlineSourcesContent: false
        };
    }

    _entries: Record<string, string>
    get entries(): Record<string, string> {
        if (this._entries) return this._entries;
        if (this.packageJson.exports) {
            const result = {};
            for (let item in this.packageJson.exports) {
                const importFile = this.packageJson.exports[item].require ??
                    this.packageJson.exports[item].default ?? this.packageJson.exports[item];
                if (!importFile || !(typeof importFile === "string")) continue;
                result[item] = path.join(
                    this.rootDir,
                    importFile
                );
            }
            return this._entries = result;
        }
        const entry = path.join(this.rootDir, this.packageJson.module
            ?? this.packageJson.main
            ?? "index.ts");
        return this._entries = {
            '.': entry
        }
    }

    term;
    log(text) {
        this.term ??= new terminalKit.Terminal();
        this.term.blue(this.packageJson.name);
        this.term.white(` ${text}\n`);
    }

    error(text) {
        this.log(`^RERROR: ^w` + text.toString());
    }

    _exports: Record<string, string>
    get exports(): Record<string, string> {
        return this._exports ??= Object.fromEntries(Object.entries(this.entries).map(
            ([entry, file]) => [entry, this.getExport(entry, file)]));
    }

    getExport(entry, file) {
        const extension = file.match(/\.([^.]+)$/)[1];
        const entryName = entry
            .replace(/^\.?\/?/, '')
            .replace(/\.[^.]+$/, '') || 'index';
        const outExt = extension
            .replace(/^[jt]sx?$/, 'js')
            .replace(/^(less|css|sass|scss)$/, 'css')
        return `${entryName}${this.flags.minify ? '.min' : ''}.${outExt}`;
    }

    async getPublishPackageJson() {
        /** @type {import('@schemastore/package').JSONSchemaForNPMPackageJsonFiles} **/
        const packageJson = JSON.parse(JSON.stringify(this.packageJson));
        for (let [entry, result] of Object.entries(this.exports)) {
            const source = this.entries[entry];
            const typings = source.endsWith('.ts')
                ? join('./dist/typings', relative(this.rootDir, source.replace(/\.ts$/, '.d.ts')))
                : null;
            if (packageJson.exports) {
                packageJson.exports[entry] = { default: `./dist/bundle/${result}` };
                if (typings){
                    packageJson.exports[entry].typings = typings;
                }
            } else {
                packageJson.main = `./dist/bundle/${result}`;
                if (typings) packageJson.typings = typings;
            }
        }
        delete packageJson.module;
        delete packageJson.browser;
        delete packageJson.scripts;
        delete packageJson.devDependencies;
        if (!packageJson.files)
            packageJson.files = ['dist'];
        return JSON.stringify(packageJson, null, '\t');
    }

    get https() {
        const host = this.packageJson.config?.host;
        if (!host) return null;
        return {
            host,
            port: this.packageJson.config.port,
            cert: join(this.rootDir, `dist/${host}.pem`),
            key: join(this.rootDir, `dist/${host}-key.pem`),
        }
    }

    _proxy;
    get proxy(): Array<{ regex: RegExp; replace}> {
        return this._proxy ??= Object.entries({
            ...this.packageJson.config?.proxy as any ?? {},
        })
            .map(([regex, replace]) => ({
                regex: new RegExp(regex),
                replace
            }));
    }
}

export class ChangeEvent extends Event {
    payload;
    from;

    constructor(payload, from) {
        super('change');
        this.payload = payload;
    }
}