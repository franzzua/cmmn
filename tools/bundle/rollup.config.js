import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import {terser} from "rollup-plugin-terser"
import {visualizer} from 'rollup-plugin-visualizer';
import styles from "rollup-plugin-styles";
import {string} from "rollup-plugin-string";
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

export const getConfig = ({minify, input, devServer, module, stats, name, outDir}) => {
    const output = `${outDir ?? 'dist'}/${name ?? 'index'}-${module}${minify ? '.min' : ''}.js`;
    return [{
        input,
        output: {
            file: output,
            sourcemap: !minify,
            format: module,
            exports: 'auto',
            name: 'global'
        },
        onwarn: function () {

        },
        // prettier-ignore
        plugins: [
            nodeResolve({
                browser: true,
                dedupe: ['lib0']
            }),
            commonjs({}),
            styles({mode: "emit"}),
            string({
                include: /\.(html|svg|less|css)$/,
            }),
            ...(minify ? [terser({})] : []),
            ...(devServer ? [
                serve({
                    open: false,
                    contentBase: ['dist', 'assets'],
                    port: 3001,
                    historyApiFallback: true
                }), livereload({
                    watch: ['dist', 'assets'],
                    verbose: false, // Disable console output

                    // other livereload options
                    port: 12345,
                    delay: 300,
                })] : []),
            ...(stats ? [
                visualizer({
                    open: true,
                    sourcemap: true,
                    template: 'treemap',
                    brotliSize: true,
                    filename: 'dist/stats.html'
                }),
            ] : [])
        ]
    }];
};
