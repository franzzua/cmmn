import {component, GlobalStaticState} from "./component";
import {HtmlComponent} from "./htmlComponent";
import {Container, Fn} from "@cmmn/core";
import "./styleHandler"

export {HtmlComponent, component};

export function setDefaultContainer(container: Container) {
    GlobalStaticState.DefaultContainer = container;
}

export * from "./types";
export {property} from "./property";
export {PointerListener, IPoint} from "./pointer"
export {Keyboard, KeyboardListener} from "./keyboard";
//
const listeners = globalThis['listeners'] = new Map<string, Map<Function, EventTarget>>();

EventTarget.prototype.addEventListener = Fn.join(
    EventTarget.prototype.addEventListener,
    function(name, listener){
        listeners.getOrAdd(name, () => new Map()).set(listener, this);
    }
);

EventTarget.prototype.removeEventListener = Fn.join(
    EventTarget.prototype.removeEventListener,
    function(name, listener){
        listeners.get(name).delete(listener);
    }
);