import {ITemplate} from "@cmmn/ui";
import {BaseFigureComponent} from "../../presentors/base-figure-component";
import {PointItem} from "../../drawing.store";

export const template: ITemplate<IState, IEvents> = (html, state, events) => html`
    <svg>
        ${BaseFigureComponent.for(state.item, {
            hovered: state.hovered
        })}
    </svg>
`;

export type IState = {
    item: PointItem;
    hovered: boolean;
}

export type IEvents = {}
