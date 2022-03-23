import {useCustomHandler} from "@cmmn/uhtml";
import {Cell} from "cellx";
import {ExtendedElement} from "./types";
import {Fn} from "@cmmn/core";
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

function getOrCreateCell(self: ExtendedElement<any>, key: string, value: Function) {
    self[propertySymbol] ??= new Map<string, Cell>();
    return self[propertySymbol].getOrAdd(key, key => new Cell(value()))
}


export function property(attribute?: string): PropertyDecorator {
    return function (this: HtmlComponentBase<any, any>, target: any, key: string) {
        const name = attribute || toSnake(key);
        (target.constructor[propertySymbol] ??= new Set<string>()).add(name);
        Object.defineProperty(target, key, {
            get(): any {
                const cell = getOrCreateCell(this.element, name, () => this.element.getAttribute(name));
                return cell.get();
            },
            set(value: string): any {
                const cell = getOrCreateCell(this.element, name, () => value);
                if (!Fn.compare(value, cell.get()))
                    cell.set(value);
            }
        });
    }
}



function toSnake(str: string): string {
    return str.replace(/[A-Z]/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : '-' + word.toLowerCase();
    });
}
