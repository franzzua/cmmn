import {minify} from "@swc/core";
import { Plugin } from "vite";

/**
 * Custom plugin to apply terser during the bundle generation. Vite doesn't minify library ES
 * modules.
 */
export function swcMinifyPlugin(): Plugin {
	return {
		name: 'custom-terser',
		async renderChunk(code, chunk) {
			// Only process JavaScript chunks
			if (!chunk.fileName.endsWith('.mjs') && !chunk.fileName.endsWith('.js')) {
				return null;
			}

			// Keep the result readable for debugging
			const result = await minify(code, {
				compress: {
					defaults: false,
					module: true,
					hoist_props: true,
					unused: true,
					dead_code: true,
				},
				ecma: 2016,
				module: true,
				format: {
					comments: false,
					ecma: 2016
				},
			});

			return result.code || null;
		},
	};
}