#!/usr/bin/env node
import * as commands from "./commands/index.js";

const [command, ...args] = process.argv.slice(2);

if (command in commands) {
    commands[command](...args);
} else {
    console.log(`cmmn compile [--watch] [--minify] [--run]`);
    console.log(`cmmn bundle [--watch]`);
    console.log(`cmmn typings [--watch]`);
    console.log(`cmmn gen AppRoot . [--nested]`);
}
