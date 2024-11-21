import {useCustomHandler} from "@cmmn/uhtml";
import {Cell, ICellOptions} from "@cmmn/cell";
import {ExtendedElement} from "./types";
import {Fn, getOrAdd} from "@cmmn/core";
import {HtmlComponentBase} from "./html-component-base";

export const propertySymbol = Symbol('properties');

export function componentHandler(self: ExtendedElement<any>, key: string): any {
    // @ts-ignore
    if (!self.constructor.observedAttributes?.includes(key))
        return null;
    return value => {
        const cell = getOrCreateCell(self, key, () => value);
        if (!Fn.compare(value, cell.get()))
            cell.set(value);
    };
}
useCustomHandler(componentHandler);

function getOrCreateCell(self: ExtendedElement<any>, key: string, value: Function, opts: ICellOptions<any> = {}) {
    self[propertySymbol] ??= new Map<string, Cell>();
    return getOrAdd(self[propertySymbol], key, key => new Cell(value(), opts))
}

export function property(options: string | ICellOptions<any> & { attributeName?: string} = {}): PropertyDecorator {
    const opts: ICellOptions<any> & { attributeName?: string} =
        (typeof options === "string") ? {attributeName: options} : options;
    return function (this: HtmlComponentBase<any, any>, target: any, key: string) {
        const name = opts.attributeName || toSnake(key);
        (target.constructor[propertySymbol] ??= new Set<string>()).add(name);
        Object.defineProperty(target, key, {
            get(): any {
                const cell = getOrCreateCell(this.element, name, () => this.element.getAttribute(name), opts);
                cell.changeOptions(opts);
                return cell.get();
            },
            set(value: string): any {
                const cell = getOrCreateCell(this.element, name, () => value, opts);
                cell.changeOptions(opts);
                if (!Fn.compare(value, cell.get()))
                    cell.set(value);
            },
            configurable: true
        });
    }
}



function toSnake(str: string): string {
    return str.replace(/[A-Z]/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : '-' + word.toLowerCase();
    });
}
