import {getPackages, Packages} from "@manypkg/get-packages";
import {JSONSchemaForNPMPackageJsonFiles} from "@schemastore/package";
import {Pack} from "./pack";
import {Target} from "./target";
import {Resolver} from "./resolver";
import {Flags} from "./flags";
import {Terminal} from "../helpers/terminal";
import {ViteBundler} from "../bundlers/vite.bundler";
import {RolldownBundler} from "../bundlers/rolldown-bundler";

export class Monorepo {
    public static async load(flags: Flags = new Flags([]), rootDir: string = process.cwd()): Promise<Monorepo> {
        const monorepoPackages = await getPackages(rootDir);
        const monorepo = new MonorepoLoader(monorepoPackages);
        await monorepo.load();
        return new Monorepo(monorepo.root as Target, monorepo.packs, flags);
    }
    public readonly packs = Array.from(this.packsMap.values()) as Pack[];
    private constructor(readonly root: Target,
                        private readonly packsMap: Map<string,Pack>,
                        readonly flags: Flags) {
        this.packs.forEach(x => x.init(flags, this.packsMap));
        root.init(flags, this.packsMap);
    }

    get targets(){
        return Array.from(this.packs.values()).filter(x => x instanceof Target) as Target[];
    }

    get(id: string) {
        return this.packsMap.get(id);
    }

    public readonly resolver = new Resolver(this.packs, this.flags);

    public createBundler(pack: Pack){
        if (pack instanceof Target)
            return new ViteBundler(pack, this.resolver, this.flags);
        return new RolldownBundler(pack, this.resolver, this.flags)
    }
}

class MonorepoLoader {

    packs = new Map<string, Pack>();
    root: Pack;

    constructor(private readonly packages: Packages) {
    }

    async load(){
        for (let p of this.packages.packages) {
            await this.export(p.packageJson.name, p.packageJson.version);
        }
        this.root = await this.export(this.packages.rootPackage.packageJson.name, this.packages.rootPackage.packageJson.version);
        return Array.from(this.packs.values());
    }

    private async export(name: string, version: string){
        if (this.packs.has(name)) return this.packs.get(name);
        const pkg = this.getPackage(name);
        if(pkg) {
            const pack = new Target(pkg.dir, pkg.packageJson)
            this.packs.set(name, pack);
            if(!pack.isServer) {
                for (let [name, version] of pack.getAllDependencies()) {
                    if (this.packs.has(name)) continue;
                    await this.export(name, version);
                }
            }
            return pack;
        } else {
            const pack = await Pack.read(name, version);
            this.packs.set(name, pack);
            return pack;
        }
    }

    private getPackage(name: string): Package | undefined {
        const p = this.packages.rootPackage.packageJson.name == name
            ? this.packages.rootPackage
            : this.packages.packages.find(x => x.packageJson.name == name);
        return p && {
            dir: p.dir,
            packageJson: p.packageJson as JSONSchemaForNPMPackageJsonFiles,
            version: p.packageJson.version,
        };
    }

}
type Package = {
    dir: string;
    packageJson: JSONSchemaForNPMPackageJsonFiles;
    version: string;
}
