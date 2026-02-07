import {Target} from "../model/target";
import {Resolver} from "../model/resolver";
import {HtmlTagDescriptor, IndexHtmlTransformContext, InlineConfig, Plugin} from "vite";
import builtinModules from "builtin-modules";
import {wasm} from "./plugins/wasm";
import swc from "unplugin-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import {dirname} from "node:path";
import {swcMinifyPlugin} from "./plugins/minify";
import {Flags} from "../model/flags";

export class ViteBuilder {
    constructor(protected readonly target: Target,
                protected readonly resolver: Resolver,
                protected readonly flags: Flags) {

    }

    async getConfig(): Promise<InlineConfig> {
        return {
            root: this.target.rootDir,
            logLevel: 'silent',
            mode: this.flags.production ? "production" : 'debug',
            optimizeDeps: {
                noDiscovery: true,
                include: []
            },
            define: {
                process: {
                    env: {
                        NODE_ENV: this.flags.production ? 'production' : 'development'
                    }
                }
            },
            html: {},
            base: this.target.publicPath + '/',
            build: {
                target: 'baseline-widely-available',
                emptyOutDir: false,
                rollupOptions: {
                    external: [
                        ...(this.resolver ? [] : Array.from(this.target.deps.keys()).map(x =>
                            new RegExp(`^${x}`.replace('/', '\\/'))
                        )),
                        ...builtinModules,
                        'fsevents',
                        /@id/g,
                    ],
                },
                write: false,
                minify: false,
                sourcemap: this.flags.minify ? false : 'inline',
                commonjsOptions: {
                    transformMixedEsModules: true
                },
            },
            plugins: [...this.getPlugins()],
        };
    }

    * getPlugins(): Generator<Plugin> {
        yield wasm();
        yield swc.vite(this.target.swcConfig) as unknown as Plugin;
        yield tsconfigPaths();
        if (this.resolver) {
            yield {
                name: this.target.packageJson.name + ':resolver',
                resolveId: this.resolver.resolveId,
                enforce: 'pre',
            };
        }
        yield {
            name: "cmmn:html-base-tag",
            enforce: 'pre',
            transformIndexHtml: (_, config: IndexHtmlTransformContext) => {
                const dir = this.flags.production ? '' : dirname(config.path);
                const result: HtmlTagDescriptor[] = [
                    {
                        tag: "base",
                        attrs: {href: `${this.target.publicPath}${dir}/`},
                        children: '/** injected **/'
                    }
                ];
                if (this.flags.production) {
                    result.push({
                        tag: "link",
                        attrs: {
                            rel: 'manifest',
                            href: `${this.target.publicPath}/manifest.json`
                        }
                    });
                }
                return result;
            },
        }
        if (this.flags.minify)
            yield swcMinifyPlugin();
        yield {
            name: "url-resolver",
            enforce: 'pre',
            resolveId: (id, importer, options) => {
                if (id.endsWith('?resolve')){
                    const resolved = this.resolver?.resolveId(id.split('?')[0], importer, {
                        ...options,
                        attributes: {
                            ...options.attributes,
                            resolve: true,
                        }
                    });
                    return resolved ? resolved.id + '?resolve' : id;
                }
            },
            load: (id) => {
                if (id.endsWith('?resolve')){
                    return `export default ${JSON.stringify(id.split('?')[0])}`;
                }
            }
        }
        // yield analyzer();
    }

}
