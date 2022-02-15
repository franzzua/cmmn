import {ITemplate} from "@cmmn/ui";
import {Mode} from "../types";
import {BaseFigurePresentor} from "../presentors/base-figure-presentor";
import {DrawingFigure} from "../model";

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
            ${state.Items.map(BaseFigurePresentor.for)}
        </svg>
    `;
};

export type IState = {
    Mode: Mode;
    Items: DrawingFigure[];
}

export type IEvents = {}
