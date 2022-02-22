import {ITemplate} from "@cmmn/ui";
import {BaseFigurePresentor} from "../../presentors/base-figure-presentor";
import {PointFigure} from "../../model/point-figure";

export const template: ITemplate<PointFigure, IEvents> = (html, state, events) => html`
    <svg>
        ${BaseFigurePresentor.for(html.svg.for('new'), state)}
    </svg>
`;

export type IEvents = {}
