import {EventListener} from "@cmmn/core";

export class AnimationFrameListener extends EventListener<{
    frame: void
}> {

    public static Instance = new AnimationFrameListener();

    constructor() {
        super(globalThis);
        requestAnimationFrame(this.handler);
    }

    private subscribed = false;

    private handler = () => {
        this.emit('frame');
        if (this.subscribed)
            requestAnimationFrame(this.handler);
    };

    protected subscribe(eventName: keyof { frame: void }) {
        this.subscribed = true;
        requestAnimationFrame(this.handler);
    }

    protected unsubscribe(eventName: keyof { frame: void }) {
        this.subscribed = false;
    }

}