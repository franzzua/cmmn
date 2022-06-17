import loader from 'postcss-modules/build/css-loader-core/loader.js';
import postCssImport from 'postcss-import';
import postCssAssets from 'postcss-assets';
import cssModules from '@modular-css/rollup';
import slug from "unique-slug";
import styles from "rollup-plugin-styles";
import {images} from "./images.js";

class Loader extends loader.default {
    failStart = '/' + process.cwd();

    fetch(_newPath, relativeTo, _trace) {
        if (relativeTo.startsWith(this.failStart))
            relativeTo = relativeTo.substring(1);
        // let newPath = _newPath.replace(/^["']|["']$/g, "");
        // let relativeDir = path.dirname(relativeTo),
        //     rootRelativePath = path.resolve(relativeDir, newPath),
        //     fileRelativePath = path.resolve(path.join(this.root, relativeDir), newPath);
        // relativeTo = path.relative(process.cwd(), relativeTo);
        // console.log({root: this.root, newPath, relativeTo, relativeDir, rootRelativePath, fileRelativePath});
        return super.fetch(_newPath, relativeTo, _trace);
    }
}

/**
 *
 * @param {ConfigCreator} config
 * @returns {(*)[]}
 * @constructor
 */
export function Styles(config) {
    return [
        images({
            output: 'assets'
            // exclude: 'node_modules/**'
        }),
        config.options.styles === "modules" ? cssModules({
            common: 'common.css',
            before: [postCssImport, postCssAssets],
            namer: function (file, selector) {
                return selector + "_" +
                    file.replace(/([\/\\]index)?(\.module)?\.css$/, "").split(/[\\\/]/).pop() + "_" +
                    slug(file)
            }
        }): styles({
            mode: "emit"
        }),
        // postcss({
        //     extract: 'output.css',
        //     ident: 'postcss',
        //     modules: {
        //         root: '',
        //         generateScopedName: `[name]_[local]_[hash:base64:5]`,
        //         Loader: Loader
        //     },
        //     use: ['sass'],
        //     plugins: [
        //         // postCssDuplicates(),
        //         postCssImport()
        //         // postcssModules({
        //         //     generateScopedName: '[local]',
        //         //     root: '',
        //         //     Loader: Loader
        //         // }),
        //         // postcssPresetEnv({
        //         //     stage: 0,
        //         // }),
        //     ],
        // }),
    ];
}


