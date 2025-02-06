#!/usr/bin/env node
import * as commands from "./commands/index.js";
import {Flags} from "./helpers/flags.js";

const [command, ...args] = process.argv.slice(2);

if (command in commands) {
    commands[command](new Flags(args));
} else {
    console.log(`cmmn dev`);
    console.log(`cmmn compile [--watch] [--minify]`);
    console.log(`cmmn bundle [--watch]`);
    console.log(`cmmn typings [--watch]`);
    console.log(`cmmn gen AppRoot . [--nested]`);
}
