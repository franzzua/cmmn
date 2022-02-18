import {bind} from "@cmmn/core";
import {html, render, svg} from "@cmmn/uhtml";
import {IEvents, ITemplate} from "./types";
import {EventHandlerProvider} from "./eventHandlerProvider";
import {HtmlComponentBase} from "./html-component-base";

export class Renderer<TState, TEvents extends IEvents> {
    // private stateCell: Cell<TState> = this.component.$state ?? cellx(() => this.stopped ? null : this.component.State).cell;
    // private actionsCells = this.component.Actions.map(action => cellx(() => {
    //     // const renderTime = this.renderCell.get();
    //     action();
    // }));
    // private effectCells = this.component.Effects.map(action => cellx(() => {
    //     if (!this.component.$render.get())
    //         return;
    //     action();
    // }));
    private eventHandler = new EventHandlerProvider(this.component);

    constructor(private component: HtmlComponentBase<TState, TEvents>,
                private template: ITemplate<TState, TEvents>) {
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
    render(state) {
        this.template.call(this.component, this.html, state, this.handlerProxy);
    }

}
