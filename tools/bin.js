#!/usr/bin/env node

import {bundle} from "./bundle/bundle.js";
import {compile} from "./compile/compile.js";

const [action, ...args] = process.argv.slice(2);

const actions = {
    bundle, compile
}

actions[action](...args);