import {existsSync, linkSync, rmSync} from "node:fs";
import path from "path";
process.env.SWCRC = true;

const from = path.resolve(import.meta.dirname, "../.swcrc");
const to = process.cwd() + "/.swcrc";
const exist = existsSync(to)
if (!exist) {
    linkSync(from, to);
    process.addListener('beforeExit', () => rmSync(to));
}
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('@swc-node/register/esm', pathToFileURL('./').toString());
