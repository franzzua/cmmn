import {Monorepo} from "./monorepo";
import {Pack} from "./pack";
import {Flags} from "./flags";
import {Target} from "./target";

export class Resolver {
    constructor(private readonly packs: Pack[],
                public basePath = '') {
    }

    /**
     * Resolve id to absolute path
     * @param id - relative path: "react", "react/jsx-runtime.js", "loro-crdt/bundler", "loro-crdt/loro.wasm"...
     * @param importer
     * @param options
     */
    public resolveId = (id: string, importer: string = null, options = null) => {
        if (options?.isEntry) return;
        const pack = this.getPack(id);
        if (!pack) return undefined;
        return this.resolveInPack(pack.pack, pack.path, importer, options);
    }

    public resolvePath(path: string, importer: string = null, options = null){
        const pack = this.getPack(path);
        if (!pack) return undefined;
        return this.resolveWithProxy(pack.pack, pack.path, importer, options) ?? pack;
    }

    private resolveWithProxy(pack: Pack, path: string, importer: string = null, options: any = null){
        if (pack instanceof Target) {
            for (let proxy of pack.proxy) {
                if (path.match(proxy.regex)) {
                    path = path.replace(proxy.regex, proxy.replace);
                    break
                }
            }
        }
        return this.resolveInPack(pack, path, importer, options);
    }

    public resolveInPack(pack: Pack, id: string, importer: string = null, options: any = null){
        if(options?.attributes?.resolve){
            return {
                external: "absolute" as boolean | "absolute" | "relative",
                id: `${this.basePath}${pack.publicPath}`,
                path: '',
                entry: null,
                pack
            }
        }
        // id - absolute path inside pack: "", "/index.ts", "/src/page.html", "/bundler", "/loro.wasm"
        const entry = pack.getEntry(id.replace(/^\//,''));
        if (!entry) {
            return;
        }
        const resolved = (!Flags.Current.production && pack instanceof Target)
            ? entry.relative : entry.output;
        return {
            external: "absolute" as boolean | "absolute" | "relative",
            id: `${this.basePath}${pack.publicPath}/${resolved}`,
            path: resolved,
            entry,
            pack
        }
    }

    getPackNames() {
        return this.packs.map(x => x.name);
    }

    public getPack(id: string): { pack: Pack, path: string } | undefined{
        for (const pack of this.packs) {
            if (pack.name == id) {
                return { pack, path: '' };
            } else if (id.startsWith(pack.name + '/')) {
                return { pack, path: id.substring(pack.name.length + 1) };
            } else if (id == pack.rootDir) {
                return { pack, path: '' };
            } else if (id.startsWith(pack.rootDir)) {
                return { pack, path: id.substring(pack.rootDir.length + 1) };
            } else if (id == pack.publicPath) {
                return { pack, path: '' };
            } else if (id.startsWith(pack.publicPath + '/')) {
                return { pack, path: id.substring(pack.publicPath.length + 1) };
            }
        }
    }
}