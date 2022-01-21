#!/usr/bin/env node

import {bundle} from "./bundle/bundle.js";
import {compile} from "./compile/compile.js";
import {gen} from "./gen/gen.js";

const [action, ...args] = process.argv.slice(2);

const actions = {
    bundle, compile, gen
}

actions[action](...args);
