import {bind, Cell, cellx, Fn, IEvent} from "@cmmn/core";
import {html, render, svg} from "@cmmn/uhtml";
import {HtmlComponent} from "./htmlComponent";
import {IEvents, ITemplate} from "./types";
import {EventHandlerProvider} from "./eventHandlerProvider";

export class CellRenderer<TState, TEvents extends IEvents> {
    private stateCell: Cell<TState> = this.component.$state ?? cellx(() => this.stopped ? null : this.component.State).cell;
    private actionsCells = this.component.Actions.map(action => cellx(() => {
        // const renderTime = this.renderCell.get();
        action();
    }));
    private effectCells = this.component.Effects.map(action => cellx(() => {
        if (!this.component.$render.get())
            return;
        action();
    }));
    private eventHandler = new EventHandlerProvider(this.component);

    constructor(private component: HtmlComponent<TState, TEvents>,
                private template: ITemplate<TState, TEvents>) {
        this.component.$render = new Cell(0);
    }

    private getHtml = html => (strings: TemplateStringsArray | string, ...args: any[]) => {
        if (typeof strings == "string" || typeof strings == "number") {
            return html.for(this, strings);
        }
        // case of html`<template>`
        if (Array.isArray(strings)) {
            return render(this.component.element, html(strings, ...args));
        }
        if (!strings) {
            // case of html()`<template>`
            return html.node;
        }
        if (args[0] == 'svg' || args[0].startsWith('svg:'))
            return svg.for(strings, args.join(','));
        // case of html(object, 'key')`<template>`
        return html.for(strings, args.join(','));
    }
    private html = Object.assign(this.getHtml(html), {
        svg: this.getHtml(svg)
    });

    handlerProxy = new Proxy({}, {
        get: (target, key) => {
            return this.eventHandler.getEventHandler(key as keyof TEvents);
        }
    });

    @bind
    render(err, event: IEvent) {
        if (this.stopped)
            return;
        this.template.call(this.component, this.html, event.data.value, this.handlerProxy);
        this.component.$render.set(this.component.$render.get() + 1);
    }

    Start() {
        this.stopped = false;
        this.stateCell.subscribe(this.render);
        for (const c of this.actionsCells) {
            c.subscribe(Fn.I);
        }
        for (const c of this.effectCells) {
            c.subscribe(Fn.I);
        }
        this.render(null, {
            data: {value: this.stateCell.get()},
            bubbles: false,
            type: 'init',
            target: this.stateCell
        } as IEvent);
    }
    private stopped = false;

    Stop() {
        this.stopped = true;
        this.stateCell.unsubscribe(this.render);
        for (const c of this.actionsCells) {
            c.dispose();
        }
        for (const c of this.effectCells) {
            c.dispose();
        }
    }
}
