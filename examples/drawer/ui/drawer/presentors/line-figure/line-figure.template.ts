import {ITemplate} from "@cmmn/ui";
import {IPoint, LineItem} from "../../drawing.store";
import {Html} from "@cmmn/ui/types";
import {Point} from "../point.template";

const radius = 3;

export const template: ITemplate<IState, IEvents> = (html, state, events) => state && html.svg`
    ${state.item.figure.map((point, i) => Point(html.svg(i), point, state.selected, state.hoveredIndex === i))}
    ${state.item.figure.slice(1).map((point, i) => getLineWithRadius(html, i, point, state.item.figure[i], radius))}
`;

export type IState = {
    item: LineItem;
    hovered: boolean;
    selected: boolean;
    hoveredIndex?: number;
}

export type IEvents = {}

function getLineWithRadius(html: Html, i: number, p1: IPoint, p2: IPoint, radius: number) {
    const tan = Math.atan2(p2.Y - p1.Y, p2.X - p1.X);
    return html.svg(`line.${i}`)`
        <line x2=${p1.X + radius * Math.cos(tan)} y2=${p1.Y + radius * Math.sin(tan)}
              x1=${p2.X - radius * Math.cos(tan)} y1=${p2.Y - radius * Math.sin(tan)}>
    `
}
