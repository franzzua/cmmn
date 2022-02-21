import {bind} from "@cmmn/core";
import {Hole, render, unroll} from "@cmmn/uhtml";
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
    private cache = new Map<object, Map<string, { stack, entry: { wire? }, wire }>>();
    private eventHandler = new EventHandlerProvider(this.component);

    constructor(private component: HtmlComponentBase<TState, TEvents>,
                private template: ITemplate<TState, TEvents>) {
    }

    private cacheFor(obj, key, type) {
        const cache = this.cache.getOrAdd(this, () => new Map()).getOrAdd(key, key => ({
            stack: [],
            entry: {},
            wire: null
        }));
        return Object.assign((template, ...values) => unroll(cache, {type, template, values}), {
            get cache(){
                return cache.entry.wire;
            }
        });
    }

    private getHtml = (type = 'html') => (strings: TemplateStringsArray | string, ...values: any[]) => {
        if (typeof strings == "string" || typeof strings == "number") {
            return this.cacheFor(this, strings, type);
        }
        // case of html`<template>`
        if (Array.isArray(strings)) {
            return render(this.component.element, new Hole(type, strings, values));
        }
        if (!strings) {
            // case of html()`<template>`
            return (template, ...values) => unroll({stack: [], entry: {}, wire: null}, {type, template, values});
        }
        // case of html(object, 'key')`<template>`
        return this.cacheFor(strings, values.join(','), type);
    }
    private html = Object.assign(this.getHtml('html'), {
        svg: this.getHtml('svg')
    });

    handlerProxy = new Proxy({}, {
        get: (target, key) => {
            return this.eventHandler.getEventHandler(key as keyof TEvents);
        }
    });

    @bind
    render(state) {
        // requestAnimationFrame(() => {
        this.template.call(this.component, this.html, state, this.handlerProxy);
        requestIdleCallback(() => {

            for (let effect of (this.component.constructor as typeof HtmlComponentBase).Effects) {
                effect.call(this.component);
            }
        });
        // });
    }

    dispose() {
        for (let x of this.cache.values()) {
            for (let y of x.values()) {
                console.log(y.entry.wire);
            }
        }
    }

}
