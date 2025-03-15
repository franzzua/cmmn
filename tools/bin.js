#!/usr/bin/env node
import {Flags} from "./helpers/flags.js";

const flags = new Flags(process.argv.slice(2));

await import((`./commands/${flags.command}.js`))
    .then(x => x[flags.command](flags))
    .catch((err) => {
        console.error(err);
        console.log('cmmn [command] [args]');
    });
