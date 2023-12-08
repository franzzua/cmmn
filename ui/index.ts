import {component, GlobalStaticState} from "./component/component";
import {AsyncHtmlComponent, HtmlComponent} from "./component/htmlComponent";
import {useCustomHandler} from "@cmmn/uhtml";

import {Renderer} from "./component/renderer";
import {intersectionObserver} from "./user-events/intersectionObserver";
import { QuerySelectorCell } from "./extensions/querySelectorCell";
import {style} from "./uhtml-ext/styleHandler";

export {HtmlComponent, component, AsyncHtmlComponent, QuerySelectorCell};

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
export * from "./extensions/event";
export * from "./extensions/select";

export {Renderer, intersectionObserver};
export {html} from "@cmmn/uhtml";
useCustomHandler(style);
