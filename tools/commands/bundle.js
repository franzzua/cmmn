import {Target} from "../helpers/target.js";
import {Terminal} from "../helpers/terminal.js";

export async function bundle(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    const term = new Terminal(flags);
    const tasks = []
    for (let target of targets) {
        if (target.tsConfig.include?.length === 0)
            continue;
        const info = {
            name: target.packageJson.name,
            state: 'idle',
            size: ''
        };
        term.add(info);
        tasks.push(target.getCompiler().then(c => c.buildApp()));
        target.addEventListener('start', () => {
            info.state = '...'
            if (flags.includes('--watch'))
                term.render();
        });
        target.addEventListener('end', () => {
            info.state = 'ok'
            if (flags.includes('--watch'))
                term.render();
        });
        target.addEventListener('change', (e) => {
            info.state = '...'
            if (flags.includes('--watch'))
                term.render();
        });
        target.addEventListener('bundle', (e) => {
            if (e.bundleName.endsWith('.map')) return;
            info.size = e.bundle.code?.length;
            if (flags.includes('--watch')) {
                term.render();
            }
        });
    }
    await Promise.all(tasks);
    term.render(false);
}
