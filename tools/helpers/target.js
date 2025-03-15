import {getDependencyOrder} from "./getProjects.js";
import path, {join, resolve} from "node:path";
import fs from "node:fs";
import {getTSConfig} from "./getTSConfig.js";
import terminalKit from "terminal-kit";

const swcConfig = JSON.parse(await fs.promises.readFile(import.meta.dirname + "/.swcrc", {
    encoding: 'utf-8'
}));

export class Target extends EventTarget {
    /** @type {string} **/
    rootDir;
    /** @type {import("./flags.js").Flags} **/
    flags;
    /** @type {Target[]} **/
    deps;
    /** @type {Map<string, Target>} **/
    depsMap;

    constructor(rootDir, flags, deps) {
        super();
        this.rootDir = rootDir;
        this.flags = flags;
        this.deps = deps;
        this.depsMap = new Map(deps.map(x => [x.packageJson.name, x]));
    }

    /**
     * @param rootDir
     * @param flags
     * @returns {Promise<Target[]>}
     */
    static async readTargets(rootDir, flags) {
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

    /**
     * @returns {import('@schemastore/package').JSONSchemaForNPMPackageJsonFiles}
     */
    get packageJson() {
        const pkgPath = path.join(this.rootDir, 'package.json');
        return this._packageJson ??= JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    }

    get externalDependencies() {
        return [
            ...Object.keys(this.packageJson.dependencies ?? {}),
            ...Object.keys(this.flags.production ? {} : this.packageJson.devDependencies ?? {}),
        ]
    }

    /**
     * @returns {{ compilerOptions: import("typescript").CompilerOptions}}
     */
    get tsConfig() {
        return this._tsConfig ??= getTSConfig(this.rootDir);
    }

    /**
     * @returns {import('@swc/types').Config}
     */
    get swcConfig() {
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
            sourceMaps: true,
            inlineSourcesContent: false
        };
    }

    /** @returns {Record<string, string>} **/
    get entries() {
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


    log(text) {
        this.term ??= new terminalKit.Terminal();
        this.term.blue(this.packageJson.name);
        this.term.white(` ${text}\n`);
    }
    error(text) {
        this.log(`^BERROR: ^w` + text.toString());
    }


    /**
     * Real package.json.exports
     * @returns {{[p: string]: string}}
     */
    get exports() {
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

    async writePackageJson() {
        for (let [entry, result] of Object.entries(this.exports)) {
            if (this.packageJson.exports) {
                this.packageJson.exports[entry] = `./dist/bundle/${result}`;
            } else {
                this.packageJson.module = `./dist/bundle/${result}`;
                delete this.packageJson.main;
                delete this.packageJson.browser;
                delete this.packageJson.scripts;
                delete this.packageJson.devDependencies;
            }
        }
        await fs.promises.writeFile(
            path.join(this.rootDir, './dist/package.json'),
            JSON.stringify(this.packageJson, null, '\t')
        )

    }
    get https(){
        const host = this.packageJson.config?.host;
        if (!host) return  null;
        return {
            host,
            port: this.packageJson.config.port,
            cert: join(this.rootDir, `dist/${host}.pem`),
            key: join(this.rootDir, `dist/${host}-key.pem`),
        }
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