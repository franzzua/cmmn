#!/usr/bin/env node

import {bundle} from "./bundle/bundle.js";
import {serve} from "./serve/serve.js";
import {compile} from "./compile/compile.js";
import {gen} from "./gen/gen.js";

const [action, ...args] = process.argv.slice(2);

const actions = {
    bundle, compile, gen, serve
}

if (action in actions) {
    actions[action](...args);
} else {
    console.log(`cmmn bundle [-b] [index.ts] [--watch] [--run] [--prod]`);
    console.log(`cmmn compile [-b] [--watch]`);
    console.log(`cmmn gen AppRoot . [--nested]`);
}
