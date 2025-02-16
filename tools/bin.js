#!/usr/bin/env node
import * as commands from "./commands/index.js";
import {Flags} from "./helpers/flags.js";

const flags = new Flags(process.argv.slice(2));

if (flags.command in commands) {
    commands[flags.command](flags);
} else {
    console.log('cmmn [command] [args]');
    console.log(Object.keys(commands).map(x => `* ${x}`).join('\n'))
}
