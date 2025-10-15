import {Target} from "../model/target.js";
import fs from "node:fs/promises";
import {join} from "node:path";
import {exec, spawn} from "node:child_process";

/**
 * @param flags {import("../model/flags.ts").Flags}
 * @returns {Promise<void>}
 */
export async function nginx(flags) {
    const targets = await Target.readTargets(process.cwd(), flags);
    const outDir = flags.get('out') ?? '/etc/nginx/conf.d';
    const proxy = flags.get('proxy') ?? '127.0.0.1';
    for (let target of targets) {
        const host = target.packageJson.config?.host;
        if (!host) continue;
        const confFile = join(outDir, `${host}.conf`);
        // if (await fs.stat(confFile).catch(() => null))
        //     continue;
        const content = nginxTemplate('/_/'+target.packageJson.name, host, target.packageJson.config?.port ?? 9000, proxy);
        await fs.writeFile(confFile, content);
        const cert = join(outDir, `${host}.pem`);
        const key = join(outDir, `${host}-key.pem`);
        await spawn('mkcert', [
            `-cert-file`, cert,
            `-key-file`, key,
            `${host}`
        ], {
            stdio: 'inherit'
        });
    }
}

export const nginxTemplate = (path, host, port, proxy) => `
map $http_upgrade $connection_upgrade {
  default upgrade;
  '' close;
}

server {
        listen              443 ssl http2;
        ssl_certificate     default/${host}.pem;
        ssl_certificate_key default/${host}-key.pem;
        server_name ${host};
        location /_ {
            proxy_set_header Host            $host;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_pass http://${proxy}:${port};
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        location / {
            rewrite ^(.*) ${path}$1 break; 
            proxy_set_header Host            $host;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_pass http://${proxy}:${port};
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
}
`;