import {Cell} from "@cmmn/cell";
import {HtmlComponentBase} from "../component/html-component-base";
import {QuerySelectorCell} from "./querySelectorCell";

export const propertySymbol = Symbol('selectors');

function getOrCreateCell(element: any, key: string, selector: string) {
    self[propertySymbol] ??= new Map<string, Cell>();
    return self[propertySymbol].getOrAdd(key, () => new QuerySelectorCell(element, selector))
}

export function select(selector: string): PropertyDecorator {
    return function (this: HtmlComponentBase<any, any>, target: any, key: string) {
        Object.defineProperty(target, key, {
            get(): any {
                const cell = getOrCreateCell(this.element, key, selector);
                return cell.get();
            },
            writable: false,
            configurable: true
        });
    }
}
