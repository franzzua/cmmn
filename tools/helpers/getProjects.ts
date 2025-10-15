import {getPackages, Package} from "@manypkg/get-packages";
import {PackageJSON} from "@manypkg/tools/src/Tool";

export async function *getOrderedPackages(rootDir: string): AsyncGenerator<{
    root: string;
    deps: string[];
}> {
    const packages = await getPackages(rootDir);
    const monorepo = new Monorepo(packages.packages);
    yield * monorepo.getTargets();
    yield {
        root: rootDir,
        deps: packages.packages.map(x => x.dir)
    };
}

class Monorepo{
    private packageMap = new Map(this.packages.map(p => [
        p.packageJson.name,
        p
    ]));
    constructor(private packages: Package[]) {
    }

    *getTargets(): Generator<{ pkg: PackageJSON, root: string, deps: string[]}>{
        const visited = new Set<Package>();
        for (let pkg of this.packages) {
            yield * this.getTargetsOf(pkg, visited)
        }
    }

    *getTargetsOf(pkg: Package, visited: Set<Package>){
        if(visited.has(pkg)) return;
        visited.add(pkg);
        const deps = [];
        for (let dep of this.getDeps(pkg)) {
            const depPkg = this.packageMap.get(dep);
            if(visited.has(depPkg)) continue;
            if (depPkg) {
                yield * this.getTargetsOf(depPkg, visited);
                deps.push(depPkg.dir);
            }
        }
        yield { root: pkg.dir, deps };
    }
    *getDeps(pkg: Package){
        for (let dep in pkg.packageJson.dependencies)
            yield dep;
        for (let dep in pkg.packageJson.devDependencies)
            yield dep;
        for (let dep in pkg.packageJson.optionalDependencies)
            yield dep;

    }
}