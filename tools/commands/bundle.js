import {Target} from "../helpers/target.js";
import {Terminal} from "../helpers/terminal.js";

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
                term.setData(target, { state: '...'});
            });
            target.addEventListener('end', () => {
                term.setData(target, { state: 'ok'});
            });
            target.addEventListener('change', (e) => {
                term.setData(target, { state: '...'});
            });
        }
        target.addEventListener('bundle', (e) => {
            if (e.bundleName.endsWith('.map')) return;
            if (flags.watch) {
                term.setData(target, { size: e.bundle.code?.length });
            } else {
                // term.setData(target, {
                //     state: 'ok',
                //     size: e.bundle.code?.length,
                // });
            }
        });
        const compiler = await target.getCompiler();
        for (let env in compiler.environments) {
            const res = await compiler.build(compiler.environments[env])
            if (!flags.watch) {
                term.setData(target, {
                    state: 'ok',
                    size: res.flatMap(x => x.output).map(x => {
                        return x.code?.length ?? 0;
                    }).reduce((a, b) => a + b)
                })
            }
        }
        // term[Symbol.dispose]();
    }
}

