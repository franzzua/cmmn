import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';
import type { Plugin, UserConfig } from 'vite';
import { wasm } from '../bundlers/plugins/wasm.ts';

export { wasm };

/**
 * TypeScript sources are compiled by `tsc -b` (standard decorators, useDefineForClassFields: false),
 * Oxc can't lower standard decorators, so Vite gets tsc output instead of transforming .ts itself.
 */
export function tscOutput(): Plugin {
	const packageRoots = new Map<string, string | null>();
	const findPackageRoot = (dir: string): string | null => {
		if (packageRoots.has(dir)) return packageRoots.get(dir);
		const parent = path.dirname(dir);
		const result = fs.existsSync(path.join(dir, 'package.json')) ? dir : parent === dir ? null : findPackageRoot(parent);
		packageRoots.set(dir, result);
		return result;
	};
	return {
		name: 'cmmn:tsc-output',
		enforce: 'pre',
		load(id) {
			const file = id.split('?')[0];
			if (!/\.(m?ts|tsx)$/.test(file) || file.endsWith('.d.ts') || file.includes('/node_modules/')) return null;
			const root = findPackageRoot(path.dirname(file));
			if (!root) return null;
			const compiled = path.join(root, 'dist/esm', path.relative(root, file)).replace(/\.(m?)tsx?$/, '.$1js');
			if (!fs.existsSync(compiled)) this.error(`${compiled} not found, run "tsc -b" first`);
			const code = fs.readFileSync(compiled, 'utf8').replace(/\n\/\/# sourceMappingURL=.*$/, '');
			let map = null;
			if (fs.existsSync(compiled + '.map')) {
				map = JSON.parse(fs.readFileSync(compiled + '.map', 'utf8'));
				map.sources = map.sources.map((s: string) => path.resolve(path.dirname(compiled), s));
			}
			return { code, map };
		},
	};
}

/** `import url from "@scope/pkg?resolve"` resolves to the package name (url of the package in deploy mode) */
export function resolveQuery(): Plugin {
	return {
		name: 'cmmn:resolve-query',
		enforce: 'pre',
		resolveId: (id) => (id.endsWith('?resolve') ? '\0' + id : null),
		load: (id) => (id.startsWith('\0') && id.endsWith('?resolve') ? `export default ${JSON.stringify(id.slice(1, -'?resolve'.length))}` : null),
	};
}

type PackageJson = {
	name: string;
	exports?: string | Record<string, string | { types?: string; default?: string }>;
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

const readPackageJson = (dir: string): PackageJson => JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));

/** entries of package.json "exports" mapped to their typescript sources: { index: "/abs/index.ts", storage: ... } */
export function getEntries(dir: string): Record<string, string> {
	const { exports } = readPackageJson(dir);
	const map = typeof exports === 'string' ? { '.': exports } : (exports ?? {});
	const entries: Record<string, string> = {};
	for (const [key, value] of Object.entries(map)) {
		const source = typeof value === 'string' ? value : (value.types ?? value.default);
		if (!source || !/\.(m?[jt]sx?)$/.test(source) || source.endsWith('.d.ts')) continue;
		entries[key === '.' ? 'index' : key.replace(/^\.\//, '')] = path.resolve(dir, source);
	}
	return entries;
}

const plugins = () => [tscOutput(), resolveQuery(), wasm()];

/** ES library bundle of package.json "exports" into dist/bundle, dependencies stay external */
export function libConfig(dir: string, config: UserConfig = {}): UserConfig {
	const pkg = readPackageJson(dir);
	const deps = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies });
	return {
		...config,
		root: dir,
		plugins: [...plugins(), ...(config.plugins ?? [])],
		build: {
			outDir: path.join(dir, 'dist/bundle'),
			emptyOutDir: true,
			target: 'baseline-widely-available',
			minify: false,
			sourcemap: true,
			lib: { entry: getEntries(dir), formats: ['es'], fileName: (_, name) => `${name}.js` },
			rolldownOptions: {
				external: [
					...deps.map((d) => new RegExp(`^${d.replace(/[/.]/g, '\\$&')}(/|\\?|$)`)),
					...builtinModules,
					/^node:/,
				],
			},
			...config.build,
		},
	};
}

/** web application from an html entry into dist/bundle */
export function appConfig(dir: string, html: string, config: UserConfig = {}): UserConfig {
	const htmlPath = path.resolve(dir, html);
	return {
		...config,
		root: path.dirname(htmlPath),
		publicDir: path.join(dir, 'public'),
		base: './',
		plugins: [...plugins(), ...(config.plugins ?? [])],
		build: {
			outDir: path.join(dir, 'dist/bundle'),
			emptyOutDir: true,
			target: 'baseline-widely-available',
			sourcemap: true,
			rolldownOptions: { input: htmlPath },
			...config.build,
		},
	};
}
