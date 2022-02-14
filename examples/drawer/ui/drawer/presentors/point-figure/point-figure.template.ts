import {ITemplate} from "@cmmn/ui";
import {PointItem} from "../../drawing.store";
import {Point} from "../point.template";

export const template: ITemplate<IState, IEvents> = (html, state, events) => state.item.figure
    ? Point(html.svg, state.item.figure, state.selected, state.hovered)
    : html.svg``;

export type IState = {
    item: PointItem;
    hovered: boolean;
    selected: boolean;
};

export type IEvents = {}
