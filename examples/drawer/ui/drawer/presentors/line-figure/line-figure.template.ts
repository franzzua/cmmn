import {ITemplate} from "@cmmn/ui";
import {IPoint, LineItem} from "../../drawing.store";
import {Html} from "@cmmn/ui/types";

const radius = 3;

export const template: ITemplate<IState, IEvents> = (html, state, events) => state && html.svg`
    ${state.figure.map((point, i) => html.svg(i)`
        <circle cx=${point.X} cy=${point.Y}, r=${radius}>
    `)}
    ${state.figure.slice(1).map((point, i) => getLineWithRadius(html, i, point, state.figure[i], radius))}
`;

export type IState = LineItem

export type IEvents = {}

function getLineWithRadius(html: Html, i: number, p1: IPoint, p2: IPoint, radius: number) {
    const tan = Math.atan2(p2.Y - p1.Y, p2.X - p1.X);
    return html.svg(`line.${i}`)`
        <line x2=${p1.X + radius * Math.cos(tan)} y2=${p1.Y + radius * Math.sin(tan)}
              x1=${p2.X - radius * Math.cos(tan)} y1=${p2.Y - radius * Math.sin(tan)}>
    `
}
