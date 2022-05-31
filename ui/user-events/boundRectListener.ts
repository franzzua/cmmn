import {cell} from "@cmmn/cell";

if (!globalThis.ResizeObserver) {
    class ROMock {
        observe() {
        }
    }

    globalThis.ResizeObserver = ROMock as any;
}

export class BoundRectListener {
    static onWindowResize() {
        for (let instance of BoundRectListener.Instances.values()) {
            if (instance.root === document) {
                instance.Rect = {left: 0, top: 0, width: window.innerWidth, height: window.innerHeight};
            } else {
                instance.Rect = (instance.root as Element).getBoundingClientRect();
            }
        }
    }

    private static observer = new globalThis.ResizeObserver(BoundRectListener.onResize);

    private static onResize(entries: ResizeObserverEntry[], observer: ResizeObserver) {
        for (let entry of entries) {
            if (!BoundRectListener.Instances.has(entry.target))
                continue;
            BoundRectListener.Instances.get(entry.target).Rect = entry.target.getBoundingClientRect();
        }
    }

    private static Instances = new Map<Element | Document, BoundRectListener>();

    public static Observe(root: Element | Document) {
        return this.Instances.getOrAdd(root, el => new BoundRectListener(el));
    }

    public static Unobserve(root: Element | Document) {
        this.Instances.get(root)?.dispose();
        this.Instances.delete(root);
    }

    private constructor(private root: Element | Document) {
        if (root instanceof Document) {
            this.rootListener = event => {
                this.Rect = {left: 0, top: 0, width: window.innerWidth, height: window.innerHeight};
            }
            window.addEventListener('resize', this.rootListener);
        } else {
            BoundRectListener.observer.observe(root);
            this.Rect = root.getBoundingClientRect();
        }
    }

    private rootListener;

    dispose() {
        if (this.root instanceof Document) {
            window.addEventListener('resize', this.rootListener);
        } else {
            BoundRectListener.observer.unobserve(this.root);
        }
    }

    @cell
    public Rect: Rect;
}

type Rect = {
    left; top; width; height;
}


window.addEventListener('resize', BoundRectListener.onWindowResize);