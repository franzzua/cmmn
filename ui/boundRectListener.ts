import {Observable} from "cellx-decorators";

export class BoundRectListener {
    static onWindowResize() {
        for (let instance of BoundRectListener.Instances.values()) {
            if (instance.root === document) {
                instance.Rect = {left: 0, top: 0, width: window.innerWidth, height: window.innerHeight};
            }else {
                instance.Rect = (instance.root as Element).getBoundingClientRect();
            }
        }
    }

    private static observer = new ResizeObserver(this.onResize);

    private static onResize(entries: ResizeObserverEntry[], observer: ResizeObserver) {
        for (let entry of entries) {
            if (!BoundRectListener.Instances.has(entry.target))
                continue;
            BoundRectListener.Instances.get(entry.target).Rect = entry.target.getBoundingClientRect();
        }
    }

    private static Instances = new Map<Element | Document, BoundRectListener>();

    public static GetInstance(root: Element | Document) {
        return this.Instances.getOrAdd(root, el => new BoundRectListener(el));
    }

    private constructor(private root: Element | Document) {
        if (root instanceof Document) {
            window.addEventListener('resize', event => {
                this.Rect = {left: 0, top: 0, width: window.innerWidth, height: window.innerHeight};
            });
        } else {
            BoundRectListener.observer.observe(root);
            this.Rect = root.getBoundingClientRect();
            BoundRectListener.Instances.set(root, this);
        }
    }

    @Observable
    public Rect: Rect;
}

type Rect = {
    left; top; width; height;
}


window.addEventListener('resize', BoundRectListener.onWindowResize);