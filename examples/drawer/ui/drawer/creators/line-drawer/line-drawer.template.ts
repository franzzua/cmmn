import {ITemplate} from "@cmmn/ui";
import {LineItem} from "../../drawing.store";
import {BaseFigureComponent} from "../../presentors/base-figure-component";

export const template: ITemplate<LineItem, IEvents> = (html, state, events) => html`
    <svg>
        ${BaseFigureComponent.for(state)}
    </svg>
`;

export type IState = {}

export type IEvents = {}
