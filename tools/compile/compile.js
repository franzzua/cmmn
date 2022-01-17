import ts from "typescript";

export function compile(target, options) {
    const config = {
        declaration: true,
        declarationDir: "dist/typings",
        experimentalDecorators: true,
        lib: ["lib.es2019.d.ts", "lib.dom.d.ts"],
        module: "ESNext",
        noEmitHelpers: true,
        noImplicitAny: true,
        downlevelIteration: true,
        noImplicitOverride: true,
        noImplicitReturns: true,
        outDir: "dist/esm",
        resolveJsonModule: true,
        target: "ES6"
    }
    // Note that there is another overload for `createWatchCompilerHost` that takes
    // a set of root files.
    const host = ts.createWatchCompilerHost(
        [target],
        config,
        ts.sys
    );

    // You can technically override any given hook on the host, though you probably
    // don't need to.
    // Note that we're assuming `origCreateProgram` and `origPostProgramCreate`
    // doesn't use `this` at all.
    const origCreateProgram = host.createProgram;
    host.createProgram = (rootNames, options, host, oldProgram) => {
        console.log("** We're about to create the program! **");
        return origCreateProgram(rootNames, options, host, oldProgram);
    };
    const origPostProgramCreate = host.afterProgramCreate;

    host.afterProgramCreate = program => {
        console.log("** We finished making the program! **");
        origPostProgramCreate(program);
    };

    // `createWatchProgram` creates an initial program, watches files, and updates
    // the program over time.
    ts.createWatchProgram(host);
}