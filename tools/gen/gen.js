import fs from "fs";
import path from "path";
import {fileURLToPath} from 'url';
import {execSync} from "child_process";

const currentDir = '__dirname' in global ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const templateTpl = fs.readFileSync(path.join(currentDir, './template.ts.tpl'), 'utf8');
const componentTpl = fs.readFileSync(path.join(currentDir, './component.ts.tpl'), 'utf8');
const styleTpl = fs.readFileSync(path.join(currentDir, './style.less.tpl'), 'utf8');


export function gen(name, directory, nested = false) {
    const Name = name.replace(/^./, c => c.toUpperCase());
    name = Name.replace(/[A-Z]/g, (c, i) => (i ? '-' : '') + c.toLowerCase());
    process.chdir(directory);
    if (nested) {
        fs.mkdirSync(name);
        process.chdir(name);
    }
    fs.writeFileSync(name + '.component.ts', componentTpl.replace(/\$Name\$/g, Name).replace(/\$name\$/g, name), 'utf8');
    fs.writeFileSync(name + '.template.ts', templateTpl.replace(/\$Name\$/g, Name).replace(/\$name\$/g, name), 'utf8');
    fs.writeFileSync(name + '.style.less', styleTpl.replace(/\$Name\$/g, Name).replace(/\$name\$/g, name), 'utf8');
    execSync(`git add ${name}.component.ts`);
    execSync(`git add ${name}.template.ts`);
    execSync(`git add ${name}.style.less`);
}
