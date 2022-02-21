import {IPoint, ITemplate} from "@cmmn/ui";
import {PointTemplate} from "../point.template";

export const template: ITemplate<IState, IEvents> = (html, state, events) => state.point
    ? PointTemplate(html.svg, state.point, {selected: state.selected, hovered: state.hovered})
    : html.svg``;

export type IState = {
    point: IPoint;
    hovered: boolean;
    selected: boolean;
};

export type IEvents = {}
