import fs from "fs";
import path from "path";
import fg from "fast-glob";

function getProjectConfig(rootDir, cmmn, options) {
    return {
        ...options,
        ...cmmn,
        rootDir: rootDir
    };
}

function getPackageConfigs(rootDir, options, name = null) {
    const pckPath = path.join(rootDir, 'package.json');
    if (!fs.existsSync(pckPath))
        return [];
    const results = [];
    const pkg = JSON.parse(fs.readFileSync(pckPath));
    if (pkg.workspaces){
        const dirs = pkg.workspaces.flatMap(pkg => fg.sync([pkg], {
            absolute: true,
            globstar: true,
            onlyDirectories: true,
            cwd: rootDir
        }));
        dirs.forEach(d => results.push(...getPackageConfigs(d, options, name)));
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

function getLernaSubPackages(lernaFile, options) {
    const config = JSON.parse(fs.readFileSync(lernaFile, 'utf8'));
    const packages = config.packages;
    const dirs = packages.flatMap(pkg => fg.sync([pkg], {
        absolute: true,
        globstar: true,
        onlyDirectories: true,
        cwd: path.dirname(lernaFile)
    }));
    return dirs.flatMap(dir => getPackageConfigs(dir, options));
}

export function getConfigOptions(options) {
    if (!options.input || options.project) {
        const rootDir = process.cwd();
        const lernaPath = path.join(rootDir, 'lerna.json');
        if (fs.existsSync(lernaPath)) {
            return getLernaSubPackages(lernaPath, options);
        }
        return getPackageConfigs(process.cwd(), options);
    }
    if (!options.input.includes('.') || !fs.existsSync(options.input)) {
        return getPackageConfigs(process.cwd(), options, options.input);
    }
    return [options];
}
