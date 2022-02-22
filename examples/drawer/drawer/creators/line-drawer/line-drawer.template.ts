import {ITemplate} from "@cmmn/ui";
import {BaseFigurePresentor} from "../../presentors/base-figure-presentor";
import {LineFigure} from "../../model/line-figure";

export const template: ITemplate<LineFigure, IEvents> = (html, state, events) => html`
    <svg>
        ${BaseFigurePresentor.for(html.svg.for(state.id), state)}
    </svg>
`;

export type IState = {}

export type IEvents = {}
