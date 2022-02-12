import {ITemplate} from "@cmmn/ui";
import {LineItem} from "../drawing.store";
import {Presentors} from "../presentors/presentors";

export const template: ITemplate<LineItem, IEvents> = (html, state, events) => html`
    <svg>
        ${state && Presentors.line(html, state)}
    </svg>
`;

export type IState = {}

export type IEvents = {}
