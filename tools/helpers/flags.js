export class Flags {
    args;
    watch;
    minify;
    workspace;
    unsafe;
    version;
    command;
    production;
    constructor(args) {
        this.command = args[0];
        this.args = args;
        this.watch = args.includes('--watch');
        this.minify = args.includes('--minify');
        this.unsafe = args.includes('--unsafe');
        this.workspace = args.includes('-w') ? args[args.indexOf('-w') + 1] ?? '.' : undefined;
        this.version = this.command === 'version' ? args[1] : undefined
        this.production = args.includes('--prod');
        if (this.workspace?.startsWith('--')){
            this.workspace = undefined;
        }
    }

}