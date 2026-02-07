import {JSONSchemaForNPMPackageJsonFiles} from "@schemastore/package";
import {dirname, join, resolve} from "node:path";
import {Flags} from "./flags";
import terminalKit from "terminal-kit";
import {readFile, stat} from "node:fs/promises";

export class Pack extends EventTarget{
    static async read(id: string, version?: string, dir = process.cwd()) {
        while (dir) {
            try {
                const pkgDir = join(dir, 'node_modules', id);
                if (await stat(pkgDir)) {
                    const json = JSON.parse(await readFile(join(pkgDir, "package.json"), {encoding: 'utf-8'})) as JSONSchemaForNPMPackageJsonFiles;
                    // TODO: check version
                    // if (version && json.version !== version)
                    //     dir = dirname(dir);
                    // else
                    return new Pack(pkgDir, json);
                }
            } catch {
                dir = dirname(dir);
            }
        }
    }

    public *getAllDependencies(prod: boolean){
        yield * Object.entries(this.packageJson.dependencies ?? {});
        if (!prod)
            yield * Object.entries(this.packageJson.devDependencies ?? {});
    }
    deps: Pack[];
    reactions: Pack[] = [];

    constructor(public readonly rootDir,
                public readonly packageJson: JSONSchemaForNPMPackageJsonFiles) {
        super();
    }
    public init(flags: Flags, packsMap: Map<string, Pack>){
        const deps = Object.keys(this.packageJson.dependencies ?? {});
        if (!flags.production)
            deps.push(...Object.keys(this.packageJson.devDependencies ?? {}));
        this.deps = deps.map(x => packsMap.get(x)).filter(x => !!x) as Pack[];
        this.deps.forEach(x => x.reactions.push(this));
        for (let dep of this.deps) {
            dep.addEventListener('change', (e: ChangeEvent) => {
                // TODO: prevent cycles
                this.dispatchEvent(new ChangeEvent(e.payload, e.from));
            });
            dep.addEventListener('file', (e: FileChangeEvent) => {
                // TODO: prevent cycles
                this.dispatchEvent(new FileChangeEvent([]));
            });
        }
    }
    public get isServer(){
        return !!this.packageJson.config?.server;
    }
    public get name(){
        return this.packageJson.name;
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

    _entries: Entry[]
    get entries(): Entry[] {
        if (this._entries) return this._entries;
        if (this.packageJson.exports && typeof this.packageJson.exports == "object") {
            const result = [] as Entry[];
            for (let item in this.packageJson.exports) {
                if (!item.startsWith('.')){
                    const exports = this.packageJson.exports as any;
                    const importFile = exports.default ?? exports.require ?? exports.import;
                    if (!importFile || !(typeof importFile === "string")) {
                        this.error(`Failed to read entry '${item}' in ${this.packageJson.name}`)
                        continue;
                    }
                    result.push(this.createEntry('.', importFile));
                    break;
                }
                const importFile = this.packageJson.exports[item].default ??
                    this.packageJson.exports[item].import ??
                    this.packageJson.exports[item].require ?? this.packageJson.exports[item];
                if (!importFile || !(typeof importFile === "string")) {
                    this.error(`Failed to read entry '${item}' in ${this.packageJson.name}`)
                    continue;
                }
                result.push(this.createEntry(item, importFile));
            }
            return this._entries = result;
        }
        const entry = this.packageJson.module
            ?? this.packageJson.main
            ?? this.packageJson.browser
            ?? this.packageJson.exports as string
        return this._entries = entry ? [this.createEntry('.', entry)] : [];
    }

    /**
     * @param name relative path inside pack: "", "/index.js", "/bundler"...
     */
    getEntry(name: string): Entry | undefined {
        return this.entries.find(x => x.name === name);
    }

    protected createEntry(name: string, source: string): Entry {
        const absolute = resolve(this.rootDir, source);
        name = name.replace(/^[.\/]+/, '');
        return {
            name,
            source: absolute,
            relative: source.replace(/^[.\/]+/, ''),
            isExcluded: false,
            isHTML: /\.html$/i.test(source),
            output: this.getExport(name, source),
            isTypeScript: /\.tsx?$/i.test(source),
            isJavaScript: /\.jsx?$/i.test(source)
        }
    }

    getExport(entry: string, file: string) {
        const extension = file.match(/\.([^.]+)$/)[1];
        const entryName = entry
            .replace(/^\.?\/?/, '')
            .replace(/\.[^.]+$/, '') || 'index';
        const outExt = extension
            .replace(/^[jt]sx?$/, 'js')
            .replace(/^(less|css|sass|scss)$/, 'css')
        return `${entryName}.${outExt}`;
    }

    get publicPath(): string{
        return `/_/${this.name}`;
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
export class FileChangeEvent extends Event{
    constructor(public files: string[]) {
        super('file');
    }

}

export type Entry = {
    name: string;
    source: string;
    relative: string;
    isHTML: boolean;
    isExcluded: boolean;
    output: string;
    isTypeScript: boolean;
    isJavaScript: boolean;
    // compiledPath: string;
    // typingsPath: string;
}