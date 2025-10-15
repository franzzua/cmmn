import {Target} from "../model/target";

export class Resolver {
    private prefix: string = '/_'
    private optimizeDeps: string[];
    public url: string;

    constructor(private targets: Target[]) {
        this.optimizeDeps = [...new Set([
            ...targets.flatMap(t => t.externalDependencies),
            // '@vite/client',
            // '@react-refresh'
        ])].filter(x => targets.every(y => y.packageJson.name !== x));
    }

    resolveId = (id) => {
        const targetPath = this.getTarget(id);
        if (targetPath) {
            return this.resolveTarget(targetPath.target, targetPath.path);
        }
        return this.resolveDependency(id);
    }


    resolveTarget(target: Target, path: string){
        const entry = target.getEntry("." + path);
        if (!entry) {
            target.error(`Entry not found for path: ${path}`);
            return
        }
        const relative = target.flags.production ? entry.output : entry.relative.substring(2);
        const resolvedId = `${this.url}${this.prefix}/${target.packageJson.name}/${relative}`;
        return {
            id: resolvedId,
            external: true
        };
    }

    resolveDependency(id: string){
        if (id.startsWith(`${this.prefix}/@id`))
            return {
                id: `${this.url}${id}`,
                external: true
            };
        if (this.optimizeDeps.some(x => id.startsWith(x))) {
            return {
                id: `${this.url}${this.prefix}/@id/${id}/`,
                external: true
            };
        }
    }

    getTarget(id: string) {
        for (const target of this.targets) {
            const path = id.match(new RegExp(`^\/?${target.packageJson.name}(?<path>.*)$`))?.groups.path;
            if(path === undefined) continue;
            if(path === '' || path.startsWith('/'))
                return { target, path}
        }
    }
}