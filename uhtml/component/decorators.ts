import {Component} from "./component";
import {cell, ICellOptions} from "@cmmn/core";

export type IComponentOptions = {
    name?: `${string}-${string}`,
};

export function component(opts: IComponentOptions = {}) {
    return (target: {
        new(): Component
        Name?: string;
    }, context: ClassDecoratorContext) => {
        // target.Name = opts.name;
        const attrs = context.metadata.observedAttributes as Record<string, string | symbol> | undefined;
        if (attrs) {
            Object.defineProperty(target, 'observedAttributes', {
                get() {
                    return Object.keys(attrs);
                }
            });
        }
        target.prototype.attributeChangedCallback = function (key, oldValue, newValue){
            if (key in attrs){
                this[attrs[key]] = newValue;
            }
        }
        customElements.define(opts.name ?? toSnake(target.name), target);
    };
}


export function property<T>(options: {
    name?: string;
} & ICellOptions<T> = {}) {
    return function (initial: ClassAccessorDecoratorTarget<Element, T>,
                     context: ClassAccessorDecoratorContext<Element, T>) {
        const attrName = options?.name ?? toSnake(context.name.toString());
        const set = (context.metadata.observedAttributes ??= {}) as Record<string, string | Symbol>;
        set[attrName] = context.name;
        if (initial) {
            context.addInitializer(function (...args) {
                // this.setAttribute(attrName, 'Hi!')
            });
        }
        return cell<T, Element>(options)(initial, context);
    }
}


export function toSnake(str: string): string {
    return str.replace(/[A-Z]/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : '-' + word.toLowerCase();
    });
}