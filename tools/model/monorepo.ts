import {getPackages, Packages} from "@manypkg/get-packages";
import {JSONSchemaForNPMPackageJsonFiles} from "@schemastore/package";
import {Pack} from "./pack";
import {Target} from "./target";

export class Monorepo {
    public static async load(rootDir: string): Promise<Monorepo> {
        const monorepoPackages = await getPackages(rootDir);
        const monorepo = new MonorepoInternal(monorepoPackages);
        await monorepo.load();
        return new Monorepo(monorepo.root as Target, monorepo.packs);
    }
    public readonly packs = Array.from(this.packsMap.values()) as Pack[];
    private constructor(readonly root: Target, private packsMap: Map<string,Pack>) {
        this.packs.forEach(x => x.init());
        root.init();
    }

    get targets(){
        return Array.from(this.packs.values()).filter(x => x instanceof Target) as Target[];
    }

    get(id: string) {
        return this.packsMap.get(id);
    }
}

class MonorepoInternal {

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
            for (let [name, version] of Object.entries(pack.dependencies)) {
                if (this.packs.has(name)) continue;
                await this.export(name, version);
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
