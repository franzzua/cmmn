export class Flags {
    static Current: Flags = new Flags([]);
    args: string[];
    watch: boolean;
    minify: boolean;
    workspace: string;
    unsafe: boolean;
    version: string;
    command: string;
    production: boolean;
    constructor(args: string[]) {
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
        Flags.Current = this;
    }

    get(arg) {
        const index = this.args.indexOf(`--${arg}`);
        if (index === -1) return undefined;
        return this.args[index + 1];
    }
}