import {IPoint, ITemplate} from "@cmmn/ui";
import {PointTemplate} from "../point.template";
import {ObservableList} from "cellx-collections";

const radius = 3;

export const LinePresentorTemplate: ITemplate<IState, IEvents> = (html, state, events) => {
    if (!state) return html.svg``;
    return html.svg`
        <g transform=${`translate(${state.start.X}, ${state.start.Y})`}>
            <path d=${state.path} ?hovered=${state.hovered} ?selected=${state.selected}/>
            ${state.points.map((point, i) => PointTemplate(html.svg.for(i), {
                X: point.X - state.start.X,
                Y: point.Y - state.start.Y,
            }, {
                selected: state.selectedIndex === null ? state.selected : state.selectedIndex === i,
                hovered: state.hoveredIndex === i
            },))}
        </g>
    `;
};

export type IState = {
    points: ObservableList<IPoint>;
    path: string;
    start: IPoint;
    hovered: boolean;
    selected: boolean;
    hoveredIndex?: number;
    selectedIndex?: number;
}

export type IEvents = {}
