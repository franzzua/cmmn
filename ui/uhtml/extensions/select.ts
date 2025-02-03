import {Cell} from "@cmmn/core";
import {Component} from "../component/component";
import {QuerySelectorCell} from "./querySelectorCell";
import {getOrAdd} from "@cmmn/core";

export const propertySymbol = Symbol('selectors');

function getOrCreateCell(element: any, key: string, selector: string) {
    self[propertySymbol] ??= new Map<string, Cell>();
    return getOrAdd(self[propertySymbol], key, () => new QuerySelectorCell(element, selector))
}

export function select(selector: string): PropertyDecorator {
    return function (this: Component, target: any, key: string) {
        Object.defineProperty(target, key, {
            get(): any {
                const cell = getOrCreateCell(this, key, selector);
                return cell.get();
            },
            configurable: true
        });
    }
}
