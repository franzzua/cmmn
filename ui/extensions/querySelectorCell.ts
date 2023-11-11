import {Cell} from "@cmmn/cell";

export class QuerySelectorCell<TElement extends Element> extends Cell<TElement> {
    constructor(private element: Element, private selector: string) {
        super(element.querySelector<TElement>(selector));
    }

    onMutation: MutationCallback = (e) => {
        this.set(this.getCurrentValue());
    }
    private observer = new MutationObserver(this.onMutation)

    getCurrentValue() {
        return this.element.querySelector<TElement>(this.selector);
    }

    active() {
        super.active();
        this.observer.observe(this.element);
    }

    disactive() {
        super.disactive();
        this.observer.disconnect();
    }
}