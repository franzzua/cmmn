import {ITemplate} from "@cmmn/ui";
import {BaseFigurePresentor} from "../../presentors/base-figure-presentor";
import {PointFigure} from "../../model/point-figure";

export const template: ITemplate<IState, IEvents> = (html, state, events) => html`
    <svg>
        ${BaseFigurePresentor.for(state.item, {
            hovered: state.hovered
        })}
    </svg>
`;

export type IState = {
    item: PointFigure;
    hovered: boolean;
}

export type IEvents = {}
