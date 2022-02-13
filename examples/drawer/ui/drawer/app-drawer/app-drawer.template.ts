import {ITemplate} from "@cmmn/ui";
import {Mode} from "../types";
import {DrawingItem} from "../drawing.store";
import {BaseFigureComponent} from "../presentors/base-figure-component";

export const Drawers = {
    [Mode.point]: html => html()`<point-drawer/>`,
    [Mode.line]: html => html()`<line-drawer/>`,
}

export const template: ITemplate<IState, IEvents> = (html, state, events) => html`
    ${(state.Mode in Drawers) ? Drawers[state.Mode](html) : ''}
    <svg>
        ${state.Items.map(BaseFigureComponent.for, state.Mode == Mode.idle ? 'edit': null)}
    </svg>
`;

export type IState = {
    Mode: Mode;
    Items: DrawingItem[];
    CreatingItem?: DrawingItem;
}

export type IEvents = {}
