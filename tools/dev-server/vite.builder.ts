import {ChangeEvent, Target} from "../helpers/target";
import {Resolver} from "./resolver";
import {
	build,
	createServer,
	HtmlTagDescriptor,
	HttpServer,
	IndexHtmlTransformContext,
	InlineConfig,
	Plugin,
	ViteDevServer
} from "vite";
import {wasm} from "./plugins/wasm";
import swc from "unplugin-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import {swcMinifyPlugin} from "./plugins/minify";
import {OutputAsset, OutputChunk, RollupOutput} from "rollup";
import {dirname} from "node:path";
import builtinModules from "builtin-modules";

export class ViteBuilder {
	readonly wsPrefix = '/@ws';
	constructor(private readonly target: Target,
	            private readonly resolver: Resolver,
	            private readonly base: string) {

	}

	async getConfig(): Promise<InlineConfig> {
		return {
			root: this.target.rootDir,
			logLevel: 'silent',
			mode: this.target.flags.production ? "production" : 'debug',
			optimizeDeps: {
				noDiscovery: true,
				include: []
			},
			keepProcessEnv: true,
			define: {
				process: {
					env: {
						NODE_ENV: this.target.flags.production ? 'production' : 'development'
					}
				}
			},
			html: {},
			base: this.base + '/',
			build: {
				target: 'baseline-widely-available',
				emptyOutDir: false,
				rollupOptions: {
					external: [
						...(this.resolver ? [] : this.target.externalDependencies.map(x =>
						    new RegExp(`^${x}`.replace('/', '\\/'))
						)),
						...builtinModules,
						'fsevents',
						/@id/g,
					],
				},
				write: false,
				minify: false,
				sourcemap: this.target.flags.minify ? false : 'inline',
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
				const dir = this.target.flags.production ? '/' : dirname(config.path);
				const result: HtmlTagDescriptor[] = [
					{
						tag: "base",
						attrs: {href: `${this.base}${dir}`},
						children: '/** injected **/'
					}
				];
				if (this.target.flags.production) {
					result.push({
						tag: "link",
						attrs: {
							rel: 'manifest',
							href: this.base + '/manifest.json'
						}
					});
				}
				return result;
			},
		}
		if (this.target.flags.minify)
			yield swcMinifyPlugin();
		// yield analyzer();
	}


	async getBundleConfig(): Promise<InlineConfig>{
		const config = await this.getConfig();
		config.build.lib = {
			entry: Object.fromEntries(this.target.entries
				.filter(x => !x.isExcluded)
				.map(x => [x.name, x.source])) as any,
			fileName: (format, entryName) => {
				if (entryName == '.') entryName = 'index';
				return `${entryName.replace(/^[./]*/, '')}.js`;
			},
			formats: ['es'],
		}
		config.build.modulePreload = false;
		return config;
	}
	private bundle: Promise<RollupOutput[]>;

	private async createBundle(): Promise<RollupOutput[]> {
		if (!this.target.entries.length)
			return [];
		const config = await this.getBundleConfig();
		return build(config).catch(err => {
			this.target.error(err.message);
			return [];
		}) as Promise<RollupOutput[]>;
	}
	public async getBundle(): Promise<Output[]>{
		const rollupOutput = await (this.bundle ??= this.createBundle());
		const outputs = rollupOutput.flatMap(x => x.output);
		return outputs.map(x => {
			return {
				fileName: x.fileName,
				data:  x.type == "asset" ? x.source : x.code,
				deps: x.type == "asset" ? [] : [
					...x.imports,
					...x.dynamicImports
				].map(path => ({
					package: path,
					path: ''
				}))
			} as Output
		})
	}

	devServerRequest: Promise<ViteDevServer>;
	async getServer(server: HttpServer) {
		return this.devServerRequest ??= this.createServer(server);
	}
	async createServer(server: HttpServer) {
		const config = await this.getConfig();
		const viteServer = await createServer({
			...config as any,
			server: {
				hmr: this.target.flags.production ? false : {
					server: server,
					path: this.wsPrefix,
				},
				ws: this.target.flags.production ? false : undefined,
				fs: {
					strict: false
				},
				allowedHosts: [
					this.target.https?.host,
					...this.target.reactions.map(x => x.https?.host)
				].filter(x => x)
			},
		});
		this.target.log(`Start dev server`);
		this.enhanceWebSocket(viteServer);
		return viteServer;
	}

	/**
	 * Emit event on ws and proxies events from dependent dev-servers
	 */
	enhanceWebSocket(server: ViteDevServer) {
		const emitChange = server.ws.send;
		server.ws.send = (payload: ChangeEvent['payload']) => {
			// if (this.target.isExcluded("")) return;
			this.target.log('change')
			this.target.dispatchEvent(new ChangeEvent(payload, this.target.packageJson.name));
		};
		this.target.addEventListener('change', (e: ChangeEvent) => {
			this.target.log('change')
			emitChange.call(server.ws, e.payload);
		});
	}
}

export type Output = {
	fileName: string;
	data: string | Uint8Array;
	deps: Array<{
		package: string;
		path: string;
	}>
}