import {useCustomHandler} from "@cmmn/uhtml";
import {Cell} from "cellx";
import {ExtendedElement} from "./types";
import {Fn} from "@cmmn/core";

export const propertySymbol = Symbol('properties');

export function componentHandler(self: ExtendedElement<any>, key: string): any {
    if (!self.component || !self.component.constructor[propertySymbol])
        return null;
    const prop = (self.component.constructor[propertySymbol] as Map<string, string>).get(key)
    const descr = Object.getOwnPropertyDescriptor(self.component.constructor.prototype, prop);
    if (descr) {
        const cell = getOrCreateCell(self.component, prop, () => null);
        return (value: any) => {
            if (!Fn.compare(value, cell.get()))
                cell.set(value);
        }
    }
}

function getOrCreateCell(self: any, key: string, value: Function) {
    const map = self[propertySymbol] ?? (self[propertySymbol] = new Map<string, Cell>());
    if (!map.has(key))
        map.set(key, new Cell(value()));
    return map.get(key);
}

export function property(attribute?: string): PropertyDecorator {
    return (target: any, key: string) => {
        if (!target.constructor[propertySymbol])
            target.constructor[propertySymbol] = new Map();
        (target.constructor[propertySymbol] as Map<string, string>).set(attribute || toSnake(key), key);
        Object.defineProperty(target, key, {
            get(): any {
                const cell = getOrCreateCell(this, key, () => this.element.getAttribute(key));
                return cell.get();
            },
            set(value: string): any {
                const cell = getOrCreateCell(this, key, () => value);
                if (!Fn.compare(value, cell.get()))
                    cell.set(value);
            }
        });
    }
}

useCustomHandler(componentHandler);


function toSnake(str: string): string {
    return str.replace(/[A-Z]/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : '-' + word.toLowerCase();
    });
}
