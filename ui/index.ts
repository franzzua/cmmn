import {component, GlobalStaticState} from "./component/component";
import {HtmlComponent, AsyncHtmlComponent} from "./component/htmlComponent";
import "./uhtml-ext/styleHandler"
import {Renderer} from "./component/renderer";

export {HtmlComponent, component, AsyncHtmlComponent};

export function setDefaultContainer(container: { get(target): any; }) {
    GlobalStaticState.DefaultContainer = container;
}

export * from "./component/types";
export {property, propertySymbol} from "./component/property";
export {PointerListener, IPoint, PointerEvents, GestureEvent} from "./user-events/pointer"
export {KeyboardListener} from "./user-events/keyboard";
export {AnimationFrame} from "./user-events/animationFrameListener";
export * from "./extensions/action";
export * from "./extensions/effect";
export * from "./extensions/react";
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
export {Renderer};