import {Target} from "../helpers/target";
import {Terminal} from "../helpers/terminal.js";
import {Bundler} from "../helpers/bundler";
import {Flags} from "../helpers/flags";

export async function bundle(flags: Flags) {
    const targets = await Target.readTargets(process.cwd(), flags);

    const term = new Terminal(flags, targets);
    for (const target of targets) {
        if (target.tsConfig.include?.length === 0)
            continue;

        const bundler = new Bundler(target, flags);

        // if (!flags.watch) {
            bundler.bundle().then(res => {
                term.setData(target, {
                    state: 'ok',
                    size: bundler.results.map(x => x.data?.length ?? 0).reduce((a, b) => a + b, 0)
                });
                for (let result of bundler.results) {
                    if (result.entry) {
                        term.term.yellow(`\t\t${result.entry.name} -> ${result.fileName}\n`)
                    } else {
                        term.term.yellow(`\t\t${result.fileName}\n`)
                    }
                }
            }).then(() => bundler.write());
        // } else {
        //
        // }
    }
}

