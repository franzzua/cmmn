import {ITemplate} from "@cmmn/ui";
import {IPoint, PointItem} from "../../drawing.store";

const radius = 3;

export const template: ITemplate<IState, IEvents> = (html, state, events) => state.figure ? html.svg`
    <circle cx=${state.figure.X} cy=${state.figure.Y}, r=${radius}>
`: html.svg``;

export type IState = PointItem;

export type IEvents = {}
