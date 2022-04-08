import {IEvents} from "./types";
import {HtmlComponentBase} from "./html-component-base";
import {Cell} from "@cmmn/cell";
import {bind, Fn} from "@cmmn/core";

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
    private DetachChildren(){
        // Hack: if there are some HtmlComponents in Children
        // their connectedCallbacks will invoke on removeChild (strange but in every browser)
        if (HtmlComponent.removing)
            return;
        if (this.Children.length) {
            HtmlComponent.removing = true;
            for (let element of this.Children) {
                this.element.removeChild(element)
            }
            HtmlComponent.removing = false;
        }
    }

    public connectedCallback() {
        this.DetachChildren();
        this.isStopped = false;
        this.$state.on('change', this._render);
        this.render(this.$state.get());
        super.connectedCallback();
    }

    protected _render = ({value}) => this.render(value);

    protected async render(state) {
        if (this.isStopped || !state)
            return;
        await this.renderer.render(state);
        this.$render.set(this.$render.get() + 1);
    }

    protected isStopped = true;

    public disconnectedCallback() {
        if (HtmlComponent.removing)
            return;
        super.disconnectedCallback();
        this.isStopped = true;
        this.$state.off('change', this._render);
    }

    $state: Cell<TState | Promise<TState>> = new Cell(() => this.isStopped ? null : this.State, {
        compare: Fn.compare
    });

    abstract get State(): TState;

    public $render: Cell<number> = new Cell(0);

}

export abstract class AsyncHtmlComponent<TState, TEvents extends IEvents> extends HtmlComponent<TState, TEvents>{

    abstract patchState(state: TState): AsyncGenerator<TState>;
    protected _render = async ({value}) => {
        for await (let state of this.patchState(value)){
            this.render(state);
        }
    }

}