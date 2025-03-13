import {Target} from "../helpers/target.js";
import {Terminal} from "../helpers/terminal.js";
import {Bundler} from "../helpers/bundler.js";

/**
 * @param flags {import("../helpers/flags.js").Flags}
 * @returns {Promise<void>}
 */
export async function bundle(flags) {
    const targets = await Target.readTargets(process.cwd(), flags);

    const term = new Terminal(flags, targets);
    for (const target of targets) {
        if (target.tsConfig.include?.length === 0)
            continue;

        if (flags.watch) {
            target.addEventListener('start', () => {
                term.setData(target, {state: '...'});
            });
            target.addEventListener('end', () => {
                term.setData(target, {state: 'ok'});
            });
            target.addEventListener('change', (e) => {
                term.setData(target, {state: '...'});
            });
        }

        target.addEventListener('bundle', (e) => {
            if (e.bundleName.endsWith('.map')) return;
            if (flags.watch) {
                term.setData(target, {size: e.bundle.code?.length});
            } else {
                // term.setData(target, {
                //     state: 'ok',
                //     size: e.bundle.code?.length,
                // });
            }
        });
        const bundler = new Bundler(target, flags);


        if (!flags.watch) {
            await bundler.bundle();
            term.setData(target, {
                state: 'ok',
                size: bundler.results.map(x => x.data.length).reduce((a, b) => a + b, 0)
            });
            for (let result of bundler.results) {
                if (result.entry) {
                    term.term.yellow(`\t\t${result.entry} -> ${result.output.replace(/^dist\/bundle\//, '')}\n`)
                } else {
                    term.term.yellow(`\t\t${result.output.replace(/^dist\/bundle\//, '')}\n`)
                }
            }
            await bundler.write();
        }
        // term[Symbol.dispose]();
    }
}

