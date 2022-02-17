import {ExtendedElement, HtmlComponent, ITemplate} from "@cmmn/ui";
import {DrawingItemType, Mode} from "../types";
import {BaseFigurePresentor} from "../presentors/base-figure-presentor";
import {DrawingFigure} from "../model";
import {PointPresentor} from "../presentors/point-figure/point-presentor.service";
import {LinePresentor} from "../presentors/line-figure/line-presentor";

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
            ${Array.from(state.Items).map(item => Extend(html.svg(item.id)`<g/>` as any, item))}
        </svg>
    `;
};

export type IState = {
    Mode: Mode;
    Items: IterableIterator<DrawingFigure>
}

export type IEvents = {}
const types = {
    [DrawingItemType.point]: PointPresentor,
    [DrawingItemType.line]: LinePresentor,
}

function Extend(element: ExtendedElement<BaseFigurePresentor<any, any>>, item: DrawingFigure) {
    if (!element.component)
        element = HtmlComponent.Extend(element, types[item.type]);
    element.component.item = item;
    return element;
}