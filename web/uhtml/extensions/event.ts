// import {Component} from "../component/html-component";
//
// export function event(name: keyof HTMLElementEventMap, options?: AddEventListenerOptions & {
//     selector?: string
// }) {
//     return (target, key, descr) => {
//
//         const listener = () => {
//             const current = options?.selector
//                 ? instance.element.querySelector(options.selector)
//                 : instance.element;
//             if (current == eventTarget) return;
//             eventTarget?.removeEventListener(name, listener, options)
//             eventTarget = current;
//             eventTarget?.addEventListener(name, listener, options);
//         }
//
//         Component.GlobalEvents.on('connected', instance => {
//             if (!(instance instanceof target.constructor))
//                 return;
//             let eventTarget: EventTarget | null = null;
//             const listener = instance[key].bind(instance);
//             instance.addEventListener('render', listener)
//             instance.once('dispose', () => {
//                 off();
//                 eventTarget?.removeEventListener(name, listener, options)
//             });
//         });
//         Component.GlobalEvents.on('disconnected', instance => {
//             if (!(instance instanceof target.constructor))
//                 return;
//             instance.removeEventListener('render', listener)
//         });
//
//         return descr;
//     }
// }
//
