import {Target} from "../helpers/target.js";
import {Terminal} from "../helpers/terminal.js";

/**
 * @param flags {import("../helpers/flags.js").Flags}
 * @returns {Promise<void>}
 */
export async function bundle(flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    const term = new Terminal(flags);
    for (let target of targets) {
        if (target.tsConfig.include?.length === 0)
            continue;
        console.log(target.rootDir)
        const info = {
            name: target.packageJson.name,
            state: 'idle',
            size: ''
        };
        term.add(info);
        target.addEventListener('start', () => {
            info.state = '...'
            if (flags.watch)
                term.render();
        });
        target.addEventListener('end', () => {
            info.state = 'ok'
            if (flags.watch)
                term.render();
        });
        target.addEventListener('change', (e) => {
            info.state = '...'
            if (flags.watch)
                term.render();
        });
        target.addEventListener('bundle', (e) => {
            if (e.bundleName.endsWith('.map')) return;
            info.size = e.bundle.code?.length;
            if (flags.watch) {
                term.render();
            }
        });
        await target.getCompiler().then(c => c.buildApp());
    }
    term.render(false);
}
