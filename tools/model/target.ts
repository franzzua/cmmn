import {join, relative} from "node:path";
import {getTSConfig, TypescriptConfig} from "../helpers/getTSConfig.ts";
import {Flags} from "./flags.ts";
import {minimatch} from 'minimatch';
import {Entry, Pack} from "./pack.ts";

export class Target extends Pack {
    public readonly publicDir = join(this.rootDir, 'public');

    get publicPath(): string | undefined {
        return this.packageJson.config?.publicPath as string ?? super.publicPath;
    }

    _tsConfig: TypescriptConfig;
    get tsConfig(): TypescriptConfig {
        return this._tsConfig ??= getTSConfig(join(this.rootDir, 'tsconfig.json'));
    }

    isExcluded(fileName: string, isRelative: boolean = false) {
        if (!isRelative)
            fileName = relative(this.rootDir, fileName);
        if (fileName.startsWith('./'))
            fileName = fileName.substring(2);
        const check = (pattern: string) => {
            return fileName.startsWith(pattern) || minimatch(fileName, pattern);
        };
        const include = this.tsConfig.include ?? [];
        if (include.length > 0) {
            if (!include.some(check))
                return true;
        }
        const exclude = this.tsConfig.exclude ?? ['dist', 'node_modules'];
        return exclude.some(check);
    }

    async getPublishPackageJson() {
        const packageJson = JSON.parse(JSON.stringify(this.packageJson));
        for (let entry of this.entries) {
            if (entry.isHTML || entry.isExcluded) continue;
            const typings = entry.isTypeScript ? './' + join('./dist/typings', relative(this.rootDir, entry.source.replace(/\.ts$/, '.d.ts'))) : undefined;
            const bundle = `./dist/bundle/${entry.output}`;
            if (packageJson.exports) {
                packageJson.exports[entry.name ? "./" + entry.name : "."] = {default: bundle, typings};
            } else {
                packageJson.main = bundle;
                packageJson.typings = typings;
            }
        }
        delete packageJson.module;
        delete packageJson.browser;
        delete packageJson.scripts;
        delete packageJson.devDependencies;
        if (!packageJson.files)
            packageJson.files = ['dist'];
        return JSON.stringify(packageJson, null, '\t');
    }

    protected createEntry(name: string, source: string): Entry {
        return {
            ...super.createEntry(name, source),
            isExcluded: this.isExcluded(source, true)
        };
    }

    get https() {
        const host = this.packageJson.config?.host;
        if (!host) return null;
        return {
            host,
            port: this.packageJson.config.port,
            cert: join(this.rootDir, `dist/${host}.pem`),
            key: join(this.rootDir, `dist/${host}-key.pem`),
        }
    }

    _proxy;
    get proxy(): Array<{ regex: RegExp; replace }> {
        return this._proxy ??= Object.entries({
            ...this.packageJson.config?.proxy as any ?? {},
        })
            .map(([regex, replace]) => ({
                regex: new RegExp(regex),
                replace
            }));
    }

}