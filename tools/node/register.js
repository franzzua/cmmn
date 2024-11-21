import {existsSync, linkSync, rmSync} from "node:fs";
import path from "path";
process.env.SWCRC = true;

const from = path.resolve(import.meta.dirname, "../helpers/.swcrc");
const to = process.cwd() + "/.swcrc";
if (!existsSync(to))
    linkSync(from, to);
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('@swc-node/register/esm', pathToFileURL('./').toString());
// process.addListener('beforeExit', () => rmSync(to));
