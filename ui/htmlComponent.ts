import {IEvents} from "./types";
import {HtmlComponentBase} from "./html-component-base";
import {Cell} from "cellx";
import {bind} from "@cmmn/core";

export abstract class HtmlComponent<TState, TEvents extends IEvents = {}> extends HtmlComponentBase<TState, TEvents> {

    constructor() {
        super();
    }

    public connectedCallback() {
        super.connectedCallback();
        this.isStopped = false;
        this.$state.subscribe(this.render);
        this.render(null, {data: {value: this.$state.get()}});
    }

    @bind
    protected async render(err, event) {
        if (this.isStopped)
            return;
        await this.renderer.render(event.data.value);
        this.$render.set(this.$render.get() + 1);
    }

    private isStopped = false;

    public disconnectedCallback() {
        super.disconnectedCallback();
        this.isStopped = true;
        this.$state.unsubscribe(this.render);
    }

    $state: Cell<TState> = new Cell(() => this.isStopped ? null : this.State);

    public $render: Cell<number> = new Cell(0);

}

