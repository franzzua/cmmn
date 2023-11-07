import fs from "fs";
import path from "path";
import {getTSConfig} from "../helpers/getTSConfig.js";

function getProjectConfig(rootDir, cmmn, options) {
    return {
        ...options,
        ...cmmn,
        rootDir: rootDir
    };
}

async function *getDependencyOrder(rootDir, visited = []) {
    const tsConfig = getTSConfig(rootDir)
    for (let reference of tsConfig.references ?? []){
        const refRoot = path.resolve(rootDir, reference.path);
        if (visited.includes(refRoot))
            continue;
        visited.push(refRoot)
        for await (let dep of await getDependencyOrder(refRoot, visited)){
            yield dep;
        }
    }
    yield rootDir;
}


async function getPackageConfigs(rootDir, options, name = null, visited = []) {
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
