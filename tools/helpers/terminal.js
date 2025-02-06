import terminalKit from "terminal-kit";

export class Terminal {
    term = terminalKit.terminal;
    data = [];
    /**
     * @type {import("./flags.js").Flags}
     */
    flags;
    constructor(flags) {
        this.flags = flags;
    }

    add(info){
        this.data.push(info);
    }

    render(clear = true) {
        if (clear) {
            this.term.clear();
        }
        this.term.yellow('CMMN bundler');
        if (this.flags.watch){
            this.term.green(' ✓ watch');
        } else {
            this.term.red(' ❌ watch')
        }
        if (this.flags.minify){
            this.term.green(' ✓ minify\n');
        }else {
            this.term.red(' ❌ minify\n');
        }
        this.term.table([
            ['name', 'state', 'size'],
            ...this.data.map(x => [x.name, x.state, this.getSize(x.size)])
        ], {
            hasBorder: false,
            firstRowTextAttr: { bgColor: 'yellow' } ,
            textAttr: { bgColor: 'black', color: 'cyan' },
            width: this.term.width,
            fit: true
        })
    }


    getSize(size){
        if (typeof size != "number") return '';
        const c = 0.8;
        for (let ch of 'bKMGT'){
            if (size < c * 1024)
                return size.toFixed(2) + ch;
            size /= 1024;
        }
        return 'Too big';
    }
}