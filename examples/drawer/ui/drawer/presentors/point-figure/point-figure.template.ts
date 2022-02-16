import {ITemplate} from "@cmmn/ui";
import {Point} from "../point.template";
import {IPoint} from "../../types";

export const template: ITemplate<IState, IEvents> = (html, state, events) => state.point
    ? Point(html.svg, state.point, {selected: state.selected, hovered: state.hovered})
    : html.svg``;

export type IState = {
    point: IPoint;
    hovered: boolean;
    selected: boolean;
};

export type IEvents = {}
