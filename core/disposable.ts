export class Disposable{

    constructor() {
        Promise.resolve().then(() => this.init());
    }

    protected init(){

    }

    private onDisposeSet = new Set<Function>();
    public set onDispose(listener) {
        if (listener && typeof listener === "function")
            this.onDisposeSet.add(listener);
    }

    public dispose(){
        this.onDisposeSet.forEach(x => x());
        this.onDisposeSet.clear();
    }

    protected onError(err: Error, source){
        console.warn(err, source);
    }
}