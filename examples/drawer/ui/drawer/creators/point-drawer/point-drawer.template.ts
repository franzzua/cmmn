import {ITemplate} from "@cmmn/ui";
import {PointItem} from "../../drawing.store";
import {BaseFigureComponent} from "../../presentors/base-figure-component";

export const template: ITemplate<PointItem, IEvents> = (html, state, events) => html`
    <svg>
        ${BaseFigureComponent.for(state)}
    </svg>
`;

export type IEvents = {}
