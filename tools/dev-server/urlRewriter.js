import {join} from "node:path";

export class UrlRewriter {
    /**
     * @type {import("../helpers/target.js").Target[]}
     */
    targets = [];

    constructor(targets, prefix) {
        this.targets = targets;
        this.prefix = prefix;
    }

    rewritePath(path, req) {
        for (const target of this.targets) {
            if (!path.startsWith(`/${this.prefix}/${target.packageJson.name}`)) continue;
            const file = path.substring(`/${this.prefix}/${target.packageJson.name}`.length);
            if (!file || file === '/') {
                const mainEntry = target.packageJson.module
                    ?? target.packageJson.exports?.['.']
                    ?? './index.ts';
                return join(`/${this.prefix}/${target.packageJson.name}/`, mainEntry);
            }
            if ("." + file in (target.packageJson.exports ?? {})) {
                const entry = target.packageJson.exports["." + file];
                return join(`/${this.prefix}/${target.packageJson.name}/`, entry);
            }
            if (file.startsWith(`/${this.prefix}`)) {
                return this.rewritePath(file, req);
            }
        }
        return path;
    }

    rewriteUrl = req => {
        return this.rewritePath(req.url, req)
    }
}