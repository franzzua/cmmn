import {ITemplate} from "@cmmn/ui";
import {LineItem} from "../drawing.store";
import {LineFigureComponent} from "../presentors/line-figure/line-figure.component";
import {PointFigureComponent} from "../presentors/point-figure/point-figure.component";

export const template: ITemplate<LineItem, IEvents> = (html, state, events) => html`
    <svg>
        ${PointFigureComponent.for(state, 'creating')}
    </svg>
`;

export type IState = {}

export type IEvents = {}
