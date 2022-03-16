import {component, GlobalStaticState} from "./component";
import {HtmlComponent} from "./htmlComponent";
import {Fn} from "@cmmn/core";
import "./styleHandler"
import { Renderer } from "./renderer";

export {HtmlComponent, component};

export function setDefaultContainer(container: {get(target): any;}) {
    GlobalStaticState.DefaultContainer = container;
}

export * from "./types";
export {property} from "./property";
export {PointerListener, IPoint, PointerEvents} from "./pointer"
export {Keyboard, KeyboardListener} from "./keyboard";
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