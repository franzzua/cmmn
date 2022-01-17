import {useCustomHandler} from "@cmmn/uhtml";
import {Cell} from "@cmmn/core";

const propertySymbol = Symbol('properties');

function componentHandler(self: any, key: string): any {
    const descr = Object.getOwnPropertyDescriptor(self.constructor.prototype, key);
    if (descr) {
        const cell = getOrCreateCell(self, key, null);
        return (value: any) => cell.set(value);
    }
}

function getOrCreateCell(self: any, key: string, value: any) {
    const map = self[propertySymbol] ?? (self[propertySymbol] = new Map<string, Cell>());
    if (!map.has(key))
        map.set(key, new Cell(value));
    return map.get(key);
}

export function property(attribute?: string): PropertyDecorator {
    return (target: any, key: string) => {
        if (!target.constructor[propertySymbol])
            target.constructor[propertySymbol] = new Set();
        (target.constructor[propertySymbol] as Set<string>).add(attribute || toSnake(key));
        Object.defineProperty(target, key, {
            get(): any {
                const cell = getOrCreateCell(this, key, this.getAttribute(key));
                return cell.get();
            },
            set(value: string): any {
                const cell = getOrCreateCell(this, key, this.getAttribute(key));
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