import {IEvents} from "./types";
import {HtmlComponentBase} from "./html-component-base";
import {Cell} from "cellx";
import {bind, Fn} from "@cmmn/core";

export abstract class HtmlComponent<TState, TEvents extends IEvents = {}> extends HtmlComponentBase<TState, TEvents> {

    constructor() {
        super();
    }
    protected InjectedContent = this.element.firstElementChild;

    static removing = false;

    public connectedCallback() {
        if (HtmlComponent.removing)
            return;
        if (this.InjectedContent) {
            HtmlComponent.removing = true;
            this.element.removeChild(this.InjectedContent)
            HtmlComponent.removing = false;
        }
        this.isStopped = false;
        this.$state.subscribe(this.render);
        this.renderer.state = this.$state.get();
        this.renderer._render();
        super.connectedCallback();
    }

    @bind
    protected async render(err, event) {
        if (this.isStopped)
            return;
        await this.renderer.render(event.data.value);
        this.$render.set(this.$render.get() + 1);
    }

    private isStopped = true;

    public disconnectedCallback() {
        if (HtmlComponent.removing)
            return;
        super.disconnectedCallback();
        this.isStopped = true;
        this.$state.unsubscribe(this.render);
    }

    $state: Cell<TState> = new Cell(() => this.isStopped ? null : this.State, {
        compareValues: Fn.compare
    });

    public $render: Cell<number> = new Cell(0);

}

