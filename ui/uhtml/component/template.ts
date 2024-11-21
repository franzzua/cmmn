import {Renderable, TemplateFunction, unroll} from "@cmmn/uhtml";
import {Html} from "./types";

export function getTemplate(type: 'html' | 'svg'): TemplateFunction<Renderable> {
    const cache = getCache();
    const result = function (template, ...values) {
        return unroll(cache, {type, template, values})
    } as Html;
    Object.defineProperty(result, 'cache', {
        get() {
            return cache.entry.wire;
        }
    });
    return result;
}

function getCache() {
    return ({
        stack: [],
        entry: {wire: null},
        wire: null
    });
}

export function getRender(type: 'html' | 'svg', element: HTMLElement | SVGElement): Html {
    const cache = getCache();
    const result = function (template, ...values) {

        const oldWire = cache.entry.wire;
        const wire = unroll(cache, {type, template, values});
        if (wire !== oldWire) {
            element.textContent = '';
            element.appendChild(wire.valueOf() as any);
        }
        return element;
    } as Html;
    Object.defineProperty(result, 'cache', {
        get() {
            return cache.entry.wire;
        }
    });
    return result;
}