import {Cell} from "@cmmn/core";

export { component, property } from './component/decorators.ts';
export { Component } from './component/component.ts';
export { html, svg, Hole } from 'uhtml';
export { htmlFor, svgFor } from 'uhtml/keyed';
// export { EventListener } from "./user-events/eventListener.ts"
// export { EventCycle } from "./user-events/event-cycle.ts"
// export { intersectionObserver } from "./user-events/intersectionObserver.ts"
// export { Pointer, PointerListener } from "./user-events/pointer.ts"
// export type { RelativePointerEvent, GestureEvent, IPoint, PointerEvents } from "./user-events/pointer.ts"
import './attrs/class.ts';
import './attrs/style.ts';

export const documentEvents = Cell.events(document);