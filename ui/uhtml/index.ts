import {Cell} from "@cmmn/core";

export { component, property } from './component/decorators';
export { Component } from './component/component';
export { html, svg } from 'uhtml';
// export { htmlFor, svgFor } from 'uhtml/keyed';
// export { EventListener } from "./user-events/eventListener"
// export { EventCycle } from "./user-events/event-cycle"
// export { intersectionObserver } from "./user-events/intersectionObserver"
// export { Pointer, PointerListener } from "./user-events/pointer"
// export type { RelativePointerEvent, GestureEvent, IPoint, PointerEvents } from "./user-events/pointer"
import './attrs/class';
import './attrs/style';

export const documentEvents = Cell.events(document);