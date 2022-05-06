export class Disposable{

    private onDisposeSet = new Set<Function>();
    public set onDispose(listener) {
        if (listener && typeof listener === "function")
            this.onDisposeSet.add(listener);
    }

    public dispose(){
        this.onDisposeSet.forEach(x => x());
        this.onDisposeSet.clear();
    }
}