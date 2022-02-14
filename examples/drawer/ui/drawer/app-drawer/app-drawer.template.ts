import {ITemplate} from "@cmmn/ui";
import {Mode} from "../types";
import {DrawingItem} from "../drawing.store";
import {BaseFigureComponent} from "../presentors/base-figure-component";

export const Drawers = {
    [Mode.point]: html => html()`<point-drawer/>`,
    [Mode.line]: html => html()`<line-drawer/>`,
};
export const Editors = {
    point: (html, item) => html(item.id)`<point-editor item=${item}/>`,
    line: (html, item) => html(item.id)`<line-editor item=${item}/>`,
};

export const template: ITemplate<IState, IEvents> = (html, state, events) => {
    // switch (state.Mode){
    //     case Mode.idle:
    //         return html`
    //             ${state.Items.map(item => Editors[item.type](html, item))}
    //         `;
    // }
    return html`
        ${(state.Mode in Drawers) ? Drawers[state.Mode](html) : ''}
        <svg>
            ${state.Items.map(BaseFigureComponent.for)}
        </svg>
    `;
};

export type IState = {
    Mode: Mode;
    Items: DrawingItem[];
    CreatingItem?: DrawingItem;
}

export type IEvents = {}
