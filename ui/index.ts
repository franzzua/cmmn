import {component, GlobalStaticState} from "./component";
import {HtmlComponent} from "./htmlComponent";
import {Container} from "@cmmn/core";
import "./styleHandler"

export {HtmlComponent, component};

export function setDefaultContainer(container: Container) {
    GlobalStaticState.DefaultContainer = container;
}

export * from "./types";
export {property} from "./property";
export {Pointer, PointerListener, IPoint} from "./pointer"
export {Keyboard, KeyboardListener} from "./keyboard";