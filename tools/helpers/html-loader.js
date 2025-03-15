import fs from "node:fs/promises";
import {join, relative} from "node:path";

/**
 * @param path
 * @param root
 * @returns {Promise<{readonly result: string, imports: {update(path: string): void; src: string;}[]}|string>}
 */
export async function htmlLoader(path, root){
    const html = await fs.readFile(path, 'utf-8');
    const {parseHTML} = await import('linkedom');
    const dom = parseHTML(html);
    const imports = [];
    for (let script of dom.document.querySelectorAll('script')) {
        imports.push({
            update: path => script.src = path,
            src: resolve(script.src, path, root)
        });
    }
    for (let style of dom.document.querySelectorAll('link[href]')) {
        imports.push({
            update: path => style.href = path,
            src: resolve(style.href, path, root)
        });
    }
    return {
        imports,
        get result(){
            return dom.document.toString()
        }
    };
}

function resolve(src, basePath, root){
    if (src.startsWith('/'))
        return join(root, src);
    return join(basePath, '..', src);
}