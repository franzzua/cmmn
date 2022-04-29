class AnimationFrameListener {

    constructor() {
    }

    private listeners = new Set<Function>();
    private oneTimeListeners = new Set<Function>();
    private isActive = false;

    public on(listener: Function){
        this.listeners.add(listener);
        if (!this.isActive){
            this.active();
        }
    }

    active(){
        this.isActive = true;
        requestAnimationFrame(this.handler);
    }

    public onceAsync(): Promise<void> {
        if (!this.isActive)
            this.active();
        return new Promise<void>(resolve => this.oneTimeListeners.add(resolve));
    }
    public off(listener: Function){
        this.listeners.delete(listener);
        if (!this.listeners.size)
            this.isActive = false;
    }

    private handler = () => {
        if (!this.isActive)
            return;
        for (const fn of this.listeners) {
            fn();
        }
        for (const fn of this.oneTimeListeners) {
            fn();
        }
        this.oneTimeListeners.clear();
        if (!this.listeners.size) {
            this.isActive = false;
            return;
        }
        requestAnimationFrame(this.handler);
    };


}

export const AnimationFrame = new AnimationFrameListener();