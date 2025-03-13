import terminalKit from "terminal-kit";

export class Terminal {
    term = terminalKit.terminal;
    /**
     * @type {import("./flags.js").Flags}
     */
    flags;
    /**
     * @type {import("./target.js").Target[]}
     */
    targets;

    headers = ['target', 'state', 'size', 'time'];
    startTime = +performance.now();
    data = {};
    constructor(flags, targets) {
        this.flags = flags;
        this.targets = targets;
        this.renderInfo();
        this.renderTable();
    }

    setData(target, data) {
        const targetData = this.data[target.packageJson.name] ??= {
            name: target.packageJson.name
        };
        Object.assign(targetData, {
            time: performance.now() - (targetData.time ?? this.startTime),
            ...data
        });
        this.renderTable(this.flags.watch);
        if (!this.flags.watch)
            this.data = {};
    }

    renderInfo() {
        this.term.yellow('CMMN bundler');
        if (this.flags.watch) {
            this.term.green(' ✓ watch');
        } else {
            this.term.red(' ❌ watch')
        }
        if (this.flags.minify) {
            this.term.green(' ✓ minify\n');
        } else {
            this.term.red(' ❌ minify\n');
        }
    }

    renderTable(){
        const showHeader = this.flags.watch || Object.keys(this.data).length === 0;
        if (this.flags.watch){
            this.term.clear();
            this.renderInfo();
        }
        this.term.table(this.fit([
            ...(showHeader ? [this.headers] : []),
            ...Object.entries(this.data).map(([name, data]) => [
                name,
                data.state,
                this.getSize(data.size),
                this.getTime(data.time)
            ])
        ]), {
            ...(showHeader ? {
                firstRowTextAttr: {bgColor: 'yellow'},
                firstRowVoidAttr: {bgColor: 'yellow'},
            } : {}),
            textAttr: {bgColor: 'black', color: 'cyan'},
            voidAttr: {bgColor: 'black', color: 'cyan'},
            firstColumnTextAttr: { width: 40 },
            hasBorder: false,
            width: 60 ,
            fit: false,
            clear: this.flags.watch
        });
    }

    fit(data){
        const nameWidth = Math.max(...this.targets.map(x => x.packageJson.name.length), 10) + 1;
        const widths = [nameWidth, 6, 10, 10];
        function setWidth(str, width, alignLeft){
            const pad = width - str.length;
            const fill = Array(Math.max(pad, 0)).fill(' ').join('');
            return alignLeft ? str + fill : fill + str;
        }
        return data.map(d => d.map((value, i) => setWidth(value, widths[i], i < 2)));
    }

    getTime(time) {
        if (time < 1000)
            return time.toFixed(0) + 'ms';
        else
            return (time / 1000).toFixed(3) + 's';
    }
    getSize(size) {
        if (typeof size != "number") return '';
        const c = 0.8;
        for (let ch of 'bKMGT') {
            if (size < c * 1024)
                return size.toFixed(2) + ch;
            size /= 1024;
        }
        return 'Too big';
    }

    [Symbol.dispose](){
    }
}