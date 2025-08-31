import fs from "node:fs";
import path, {join} from "node:path";
import {getTSConfig} from "./getTSConfig";

function getProjectConfig(rootDir, cmmn, options) {
    return {
        ...options,
        ...cmmn,
        rootDir: rootDir
    };
}

export async function *getDependencyOrder(rootDir: string, visited: string[] = []): AsyncGenerator<{ root: string; deps: string[] }> {
    const tsConfig = getTSConfig(join(rootDir, 'tsconfig.json'));
    const deps: string[] = [];
    for (let reference of tsConfig.references ?? []){
        const refRoot = path.resolve(rootDir, reference.path);
        if (visited.includes(refRoot)) {
            deps.push(refRoot);
            continue;
        }
        visited.push(refRoot)
        for await (const dep of getDependencyOrder(refRoot, visited)){
            deps.push(dep.root);
            yield dep;
        }
    }
    yield { root: rootDir, deps };
}


async function getPackageConfigs(rootDir, options, name = null) {
    const pckPath = path.join(rootDir, 'package.json');
    if (!fs.existsSync(pckPath))
        return [];
    const results = [];
    const pkg = JSON.parse(await fs.promises.readFile(pckPath));
    if (pkg.cmmn) {
        if (name) {
            results.push(getProjectConfig(rootDir, pkg.cmmn[name], {
                ...options,
                name,
                package: pkg.name,
            }));
        } else {
            for (let name in pkg.cmmn) {
                results.push(getProjectConfig(rootDir, pkg.cmmn[name], {
                    ...options,
                    name,
                    package: pkg.name,
                }));
            }
        }
    }
    return results;
}


export async function getConfigOptions(options) {
    const result = []
    for await (let project of getDependencyOrder(process.cwd())){
        const configs = await getPackageConfigs(project, options);
        result.push(...configs);
    }
    return result;
}
