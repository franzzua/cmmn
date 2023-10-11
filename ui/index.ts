import {component, GlobalStaticState} from "./component/component.js";
import {AsyncHtmlComponent, HtmlComponent} from "./component/htmlComponent.js";
import "./uhtml-ext/styleHandler"
import {Renderer} from "./component/renderer.js";
import {intersectionObserver} from "./user-events/intersectionObserver.js";

export {HtmlComponent, component, AsyncHtmlComponent};

export function setDefaultContainer(container: { get(target): any; }) {
    GlobalStaticState.DefaultContainer = container;
}

export * from "./component/types.js";
export {property, propertySymbol} from "./component/property.js";
export {PointerListener, IPoint, PointerEvents, GestureEvent} from "./user-events/pointer.js"
export {KeyboardListener} from "./user-events/keyboard.js";
export {AnimationFrame} from "./user-events/animationFrameListener.js";
export * from "./extensions/action.js";
export * from "./extensions/effect.js";
export * from "./extensions/react.js";
//
// const listeners = globalThis['listeners'] = new Map<string, Map<Function, EventTarget>>();
//
// EventTarget.prototype.addEventListener = Fn.join(
//     EventTarget.prototype.addEventListener,
//     function(name, listener){
//         listeners.getOrAdd(name, () => new Map()).set(listener, this);
//     }
// );
//
// EventTarget.prototype.removeEventListener = Fn.join(
//     EventTarget.prototype.removeEventListener,
//     function(name, listener){
//         listeners.get(name).delete(listener);
//     }
// );
export {Renderer, intersectionObserver};
export {html} from "@cmmn/uhtml";