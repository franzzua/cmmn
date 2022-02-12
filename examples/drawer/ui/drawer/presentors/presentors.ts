import {DrawingItem, LineItem, PointItem} from "../drawing.store";
import {LinePresentor} from "./line-presentor";

export const Presentors: {
    [type in DrawingItem["type"]]: (html, item: DrawingItem) => any;
} = {
    point: (html, item: PointItem) => html('svg:' + item.id)`
        <circle cx=${item.figure.X} cy=${item.figure.Y}>
    `,
    line: (html, item: LineItem) => new LinePresentor(item).render(),
    polygon: (html, item: LineItem) => new LinePresentor(item).render(),

}

