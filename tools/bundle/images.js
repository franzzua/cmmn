import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { createFilter } from 'rollup-pluginutils';
const defaultExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

export function images(options = {}) {
    const extensions = options.extensions || defaultExtensions;
    const includes = extensions.map(e => `**/*${e}`);
    const filter = createFilter(options.include || includes, options.exclude);
    const assetsDir = options.output ?? 'assets';
    let images = [];

    function generateBundle(outputOptions, rendered) {
        if (!images.length)
            return;
        const outDir =
            outputOptions.dir || dirname(outputOptions.dest || outputOptions.file);
        const distDir = join(outDir, assetsDir);
        if (!existsSync(distDir)) {
            mkdirSync(distDir, {recursive: true});
        }
        images.forEach(id => {
            writeFileSync(`${distDir}/${basename(id)}`, readFileSync(id));
        });
    }

    return {
        name: 'image-file',
        load(id) {
            if ('string' !== typeof id || !filter(id)) {
                return null;
            }

            if (images.indexOf(id) < 0) {
                images.push(id);
            }
            return `export default '/${assetsDir}/${basename(id)}';`;
        },
        generateBundle,
        ongenerate: generateBundle
    };
}

