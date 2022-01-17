import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import {terser} from "rollup-plugin-terser"
import { visualizer } from 'rollup-plugin-visualizer';

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
                })
            ]
        }
    }
    return ({
        input,
        output: [
            {
                file: 'dist/index-cjs.js',
                format: 'cjs',
                exports: 'auto',
            },
            {
                file: 'dist/index-umd.js',
                format: 'umd',
                exports: 'auto',
                name: 'default'
            },
            {
                file: 'dist/index-es.js',
                exports: 'auto',
                format: 'es'
            }
        ],
        // prettier-ignore
        plugins: [
            commonjs(),
            nodeResolve({
                browser: true,
            })
        ]
    });
};
