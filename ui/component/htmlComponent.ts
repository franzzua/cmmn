import {IEvents} from "./types";
import {HtmlComponentBase} from "./html-component-base";
import {Cell} from "@cmmn/cell";
import {Fn} from "@cmmn/core";

export abstract class HtmlComponent<TState, TEvents extends IEvents = {}> extends HtmlComponentBase<TState, TEvents> {

    constructor() {
        super();
    }

    protected Children: Element[] = Array.from(this.element.children)
        .filter(x => x instanceof Element);

    static removing = false;

    /**
     * Removes children element and sets into this.Children
     * So you can render it somewhere inside element
     */
    private DetachChildren() {
        // Hack: if there are some HtmlComponents in Children
        // their connectedCallbacks will invoke on removeChild (strange but in every browser)
        if (HtmlComponent.removing)
            return;
        if (this.Children.length) {
            HtmlComponent.removing = true;
            try {
                for (let element of this.Children) {
                    element.remove();
                }
            } finally {
                HtmlComponent.removing = false;
            }
        }
    }

    public connectedCallback() {
        this.DetachChildren();
        this.onDispose = this.$state.on('change', this._render);
        this.onDispose = this.$state.on('error', e => this.onError(e, 'state'));
        try {
            this.render(this.$state.get());
        } catch (e) {
            this.onError(e, 'state');
        }
        super.connectedCallback();
    }

    protected _render = ({value}) => this.render(value);

    protected async render(state) {
        if (state === undefined)
            return;
        await this.renderer.render(state);
        this.$render.set(this.$render.get() + 1);
    }

    public disconnectedCallback() {
        if (HtmlComponent.removing)
            return;
        super.disconnectedCallback();
    }

    $state: Cell<TState | Promise<TState>> = new Cell(() => this.State, {
        compare: Fn.compare
    });

    abstract get State(): TState;

    public $render: Cell<number> = new Cell(0);

}

export abstract class AsyncHtmlComponent<TState, TEvents extends IEvents> extends HtmlComponent<TState, TEvents> {

    abstract patchState(state: TState): AsyncGenerator<TState>;

    protected _render = async ({value}) => {
        for await (let state of this.patchState(value)) {
            this.render(state);
        }
    }

}