import {IPoint, ITemplate} from "@cmmn/ui";
import {Html} from "@cmmn/ui/types";
import {Point} from "../point.template";
import {ObservableList} from "cellx-collections";

const radius = 3;

export const template: ITemplate<IState, IEvents> = (html, state, events) => state && html.svg`
    <path d=${state.path} ?hovered=${state.hovered} ?selected=${state.selected}/>
    ${state.points.map((point, i) => Point(html.svg(i), point, {
        selected: state.selectedIndex === null ? state.selected : state.selectedIndex === i,
        hovered: state.hoveredIndex === i
    },))}
`;

export type IState = {
    points: ObservableList<IPoint>;
    path: string;
    hovered: boolean;
    selected: boolean;
    hoveredIndex?: number;
    selectedIndex?: number;
}

export type IEvents = {}

function getLineWithRadius(html: Html, i: number, p1: IPoint, p2: IPoint, radius: number) {
    const tan = Math.atan2(p2.Y - p1.Y, p2.X - p1.X);
    return html.svg(`line.${i}`)`
        <line x2=${p1.X + radius * Math.cos(tan)} y2=${p1.Y + radius * Math.sin(tan)}
              x1=${p2.X - radius * Math.cos(tan)} y1=${p2.Y - radius * Math.sin(tan)}>
    `
}
