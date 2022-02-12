import { Fn } from "@cmmn/core";
import {ITemplate} from "@cmmn/ui";
import {IPoint, PointItem} from "../drawing.store";
import {Presentors} from "../presentors/presentors";

export const template: ITemplate<PointItem, IEvents> = (html, state, events) => html`
    <svg>
        ${state && Presentors.point(html, state)}
    </svg>
`;

export type IEvents = {}
