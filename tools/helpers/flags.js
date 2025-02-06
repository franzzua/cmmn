export class Flags {
    args;
    watch;
    minify;
    workspace;
    constructor(args) {
        this.args = args;
        this.watch = args.includes('--watch');
        this.minify = args.includes('--minify');
        this.workspace = args.includes('-w') ? args[args.indexOf('-w') + 1] ?? '.' : undefined;
        if (this.workspace?.startsWith('--')){
            this.workspace = undefined;
        }
    }

}