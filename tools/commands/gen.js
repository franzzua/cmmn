import fs from "fs/promises";
import path from "path";
import {execSync} from "child_process";

async function readFiles() {
    return Promise.all([
        fs.readFile(path.join(import.meta.dirname, './gen/template.ts.tpl'), {encoding: 'utf8'}),
        fs.readFile(path.join(import.meta.dirname, './gen/component.tsx.tpl'), {encoding: 'utf8'}),
        fs.readFile(path.join(import.meta.dirname, './gen/style.less.tpl'), {encoding: 'utf8'}),
    ]);
}


export async function gen(name, directory, nested = false) {
    const Name = name.replace(/^./, c => c.toUpperCase());
    name = Name.replace(/[A-Z]/g, (c, i) => (i ? '-' : '') + c.toLowerCase());
    process.chdir(directory);
    if (nested) {
        await fs.mkdir(name);
        process.chdir(name);
    }
    const [templateTpl, componentTpl, styleTpl] = await readFiles();
    await Promise.all([
        fs.writeFile(name + '.component.tsx', componentTpl.replace(/\$Name\$/g, Name).replace(/\$name\$/g, name), 'utf8'),
        fs.writeFile(name + '.template.ts', templateTpl.replace(/\$Name\$/g, Name).replace(/\$name\$/g, name), 'utf8'),
        fs.writeFile(name + '.style.less', styleTpl.replace(/\$Name\$/g, Name).replace(/\$name\$/g, name), 'utf8'),
    ]);
    execSync(`git add ${name}.component.ts`);
    execSync(`git add ${name}.template.ts`);
    execSync(`git add ${name}.style.css`);
}
