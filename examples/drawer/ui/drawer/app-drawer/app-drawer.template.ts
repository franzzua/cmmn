import {ITemplate} from "@cmmn/ui";
import {Mode} from "../types";
import {PointDrawerComponent} from "../point-drawer/point-drawer.component";
import {DrawingItem} from "../drawing.store";
import {Presentors} from "../presentors/presentors";
import {LineDrawerComponent} from "../line-drawer/line-drawer.component";

export const Drawers = {
    [Mode.point]: document.createElement(PointDrawerComponent.Name),
    [Mode.line]: document.createElement(LineDrawerComponent.Name)
}

export const template: ITemplate<IState, IEvents> = (html, state, events) => html`
    ${Drawers[state.Mode]}
    
    <svg>
        ${state.Items.map(item => Presentors[item.type](html, item))}
    </svg>
`;

export type IState = {
    Mode: Mode,
    Items: DrawingItem[]
}

export type IEvents = {}
