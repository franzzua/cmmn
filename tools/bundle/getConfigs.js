import fs from "fs";
import path from "path";
import fg from "fast-glob";
import { dependencyOrder } from "dependency-order";

function getProjectConfig(rootDir, cmmn, options) {
    return {
        ...options,
        ...cmmn,
        rootDir: rootDir
    };
}

async function getPackageConfigs(rootDir, options, name = null, visited = []) {
    const pckPath = path.join(rootDir, 'package.json');
    if (!fs.existsSync(pckPath))
        return [];
    const results = [];
    const pkg = JSON.parse(fs.readFileSync(pckPath));
    const packageInfos = await dependencyOrder({
        cwd: rootDir
    });
    for (let packageInfo of packageInfos) {
        const root = packageInfo.packageMeta.directory;
        if (visited.includes(root))
            continue;
        console.log(root)
        visited.push(root)
        const configs = await getPackageConfigs(root, options, name, visited);
        results.push(...configs);
    }
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
    if (!options.input || options.project) {
        return await getPackageConfigs(process.cwd(), options);
    }
    if (!options.input.includes('.') || !fs.existsSync(options.input)) {
        return await getPackageConfigs(process.cwd(), options, options.input);
    }
    return [options];
}
