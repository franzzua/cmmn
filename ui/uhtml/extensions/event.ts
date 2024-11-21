import {HtmlComponent} from "../component/htmlComponent";

export function event(name: keyof HTMLElementEventMap, options?: AddEventListenerOptions & {
    selector?: string
}) {
    return (target, key, descr) => {
        HtmlComponent.GlobalEvents.on('connected', instance => {
            if (!(instance instanceof target.constructor))
                return;
            let eventTarget: EventTarget | null = null;
            const listener = instance[key].bind(instance);
            const off = instance.on('render', e => {
                const current = options?.selector
                    ? instance.element.querySelector(options.selector)
                    : instance.element;
                if (current == eventTarget) return;
                eventTarget?.removeEventListener(name, listener, options)
                eventTarget = current;
                eventTarget?.addEventListener(name, listener, options);
            })
            instance.once('dispose', () => {
                off();
                eventTarget?.removeEventListener(name, listener, options)
            });
        });
        return descr;
    }
}

