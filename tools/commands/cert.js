import {Target} from "../helpers/target.js";
import fs from "node:fs/promises";
import {exec} from "node:child_process";

export async function cert(...flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    for (let target of targets) {
        const https = target.https;
        if (!https) continue;
        const [cert, key] = await Promise.all([
            fs.stat(https.cert).catch(() => null),
            fs.stat(https.key).catch(() => null),
        ]);
        if (!cert || !key){
            const mkcert = await exec([
                'mkcert',
                `-cert-file ${https.cert}`,
                `-key-file ${https.key}`,
                `"*.${https.host}"`
            ].join(' '));
            mkcert.stdout.pipe(process.stdout);
            mkcert.stderr.pipe(process.stderr);
        }
    }
}