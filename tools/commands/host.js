import {Target} from "../helpers/target";
import fs from "node:fs/promises";

export async function host(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    const content = await fs.readFile('/etc/hosts', {encoding: 'utf-8'});
    let lines = [];
    for (let target of targets) {
        const host = target.packageJson.config?.host;
        if (!host) continue;
        const line = `127.0.0.1 ${host}`;
        if (!content.includes(line))
            lines.push(line);
    }
    if (lines.length) {
        if (content.substring(content.lastIndexOf('\n')).trim().length) console.log();
        console.log(lines.join('\n'));
    }
}