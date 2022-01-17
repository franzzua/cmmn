import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import {terser} from "rollup-plugin-terser"
import { visualizer } from 'rollup-plugin-visualizer';
import  less from 'rollup-plugin-less';
import { string } from "rollup-plugin-string";
import serve from 'rollup-plugin-serve'

export const getConfig = ({minify, input, devServer}) => {
    if (minify){
        return {
            input,
            output: {
                file: 'dist/index.min.js',
                format: 'cjs'
            },
            plugins: [
                commonjs(),
                nodeResolve({
                    browser: true,
                }),
                terser({
                }),
                visualizer({
                    open: true,
                    template: 'sunburst',
                    brotliSize: true,
                    filename: 'dist/stats.html'
                }),

            ]
        }
    }
    return ({
        input,
        output: [
            {
                file: 'dist/index-cjs.js',
                sourcemap: true,
                format: 'cjs',
                exports: 'auto',
            },
            {
                file: 'dist/index-umd.js',
                sourcemap: true,
                format: 'umd',
                name: 'global'
            },
            {
                file: 'dist/index-es.js',
                sourcemap: true,
                exports: 'auto',
                format: 'es'
            }
        ],
        // prettier-ignore
        plugins: [
            nodeResolve({
                browser: true,
            }),
            commonjs({

            }),
            less({
               insert: true
            }),
            string({
                include: /\.(html|svg)$/,
            }),
            ...[devServer ? serve({
                open: false,
                contentBase: ['dist', 'assets'],
                port: 3001,
                historyApiFallback: true
            }) : '']
        ]
    });
};
