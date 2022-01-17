import {bind, Cell, cellx, Fn, IEvent} from "@cmmn/core";
import {html, render} from "@cmmn/uhtml";
import {HtmlComponent} from "./htmlComponent";
import {IEvents, ITemplate} from "./types";
import {EventHandlerProvider} from "./eventHandlerProvider";

export class CellRenderer<TState, TEvents extends IEvents> {
    private stateCell: Cell<TState> = this.component.$state ?? cellx(() => this.component.State).cell;
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
        this.component.$render = new Cell(undefined);
    }

    private html = (strings: TemplateStringsArray | string, ...args: any[]) => {
        if (typeof strings == "string") {
            // case of html('key')`<template>`
            return html.for(this, strings);
        }
        // case of html`<template>`
        if (Array.isArray(strings)) {
            return render(this.component, html(strings, ...args));
        }
        if (!strings) {
            // case of html()`<template>`
            return html.node;
        }
        // case of html(object, 'key')`<template>`
        return html.for(strings, args.join(','));
    }

    handlerProxy = new Proxy({}, {
        get: (target, key) => {
            return this.eventHandler.getEventHandler(key as keyof TEvents);
        }
    });

    @bind
    render(err: any, event: IEvent) {
        this.template.call(this.component, this.html, event.data.value, this.handlerProxy);
        this.component.$render.set(Fn.ulid());
    }

    Start() {
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

    Stop() {
        this.stateCell.unsubscribe(this.render);
        for (const c of this.actionsCells) {
            c.unsubscribe(Fn.I);
        }
        for (const c of this.effectCells) {
            c.unsubscribe(Fn.I);
        }
    }
}
