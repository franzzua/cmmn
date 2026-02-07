import {Flags} from "../model/flags";
import {dirname, join} from "node:path";
import {cp, mkdir, writeFile, link, rm} from "node:fs/promises";
import {Monorepo} from "../model/monorepo";
import {Target} from "../model/target";
import {gzipSync, brotliCompressSync} from "node:zlib";
import {Pack} from "../model/pack";
import {Bundle} from "../model/bundle";
import {Terminal} from "../helpers/terminal";

export async function bundle(flags: Flags) {
	const monorepo = await Monorepo.load(flags);
    const term = new Terminal(monorepo.flags, monorepo.packs);
    for (let pack of monorepo.packs.values()) {
        if (flags.workspace && (
            !pack.name.match(new RegExp(flags.workspace))
            || pack.name == flags.workspace
        ))
            continue;
        const runnner = flags.deploy
            ? new DeployCommandRunnner(pack, monorepo)
            : new BundleCommandRunner(pack, monorepo);
        if (!runnner.shouldWrite())
            continue;
        try {
            const size = await runnner.write();
            term.setData(pack, {
                state: 'ok',
                size: size
            });
        } catch (e){
            pack.error(e.message + e.stack);
        }
    }
}

class BundleCommandRunner {
    constructor(protected pack: Pack, protected monorepo: Monorepo){
    }
    get flags(){ return this.monorepo.flags; }

    async write(){
        const bundler = this.monorepo.createBundler(this.pack);
        const bundle = await bundler.bundle();
        return await this.writeBundle(bundle);
    }

    protected async writeBundle(bundle: Bundle){
        await rm(this.outDir, {recursive: true, force: true}).catch(err => {
            console.error(err);
        });
        let size = 0;
        for (let file of bundle.fileNames()) {
            const path = join(this.outDir, file);
            const data = bundle.get(file);
            await this.writeFile(path, data);
            size += data.length;
        }

        if (this.pack instanceof Target && this.pack.publicDir)
            await cp(this.pack.publicDir, this.outDir, {
                recursive: true
            }).catch(() => {});
        return size;
    }

    public shouldWrite(): boolean {
        return (this.pack instanceof Target);
    }


    protected get outDir(){
        return join(this.pack.rootDir, 'dist/bundle');
    }

    protected async writeFile(path: string, data: string | Uint8Array){
        const dir = dirname(path);
        await mkdir(dir, {recursive: true});
        await writeFile(path, data);
    }
}

class DeployCommandRunnner extends BundleCommandRunner {
    get outRoot() { return  join(process.cwd(), this.flags.out, 'web') ;}

    constructor(pack: Pack, monorepo: Monorepo) {
        super(pack, monorepo);
    }

    protected async writeBundle(bundle: Bundle): Promise<number> {
        const size = await super.writeBundle(bundle);

        const manifest = await bundle.getBundleJson();
        await this.writeFile(join(this.outDir, 'bundle.json'), JSON.stringify(manifest, null, 2));
        if (this.pack.name === '@cmmn/service-worker'){
            await this.writeFile(join(this.outRoot, '_sw.js'), bundle.get('worker.js'))
        }
        return size;
    }

    public shouldWrite(): boolean {
        return true;
    }

    protected get outDir(){
        return join(this.outRoot, this.pack.publicPath);
    }

    protected async writeFile(path, data){
        await super.writeFile(path, data);
        if (this.flags.args.includes('--gzip'))
            await writeFile(path+'.gz', gzipSync(data));
        if (this.flags.args.includes('--brotli'))
            await writeFile(path+'.br', brotliCompressSync(data));
    }
}
