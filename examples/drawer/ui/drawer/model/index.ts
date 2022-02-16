import {LineFigure} from "./line-figure";
import {PointFigure} from "./point-figure";
import {PolygonFigure} from "./polygon-figure";
import {DrawingFigureJson, DrawingItemType, IPoint} from "../types";

export type DrawingFigure = LineFigure | PointFigure | PolygonFigure;

export function DrawingFigureFactory(json: DrawingFigureJson) {
    switch (json.type) {
        case DrawingItemType.point:
            return new PointFigure(json.id, json.figure as IPoint);
        case DrawingItemType.line:
            return new LineFigure(json.id, json.figure as IPoint[]);
        case DrawingItemType.polygone:
            return new PolygonFigure(json.id, json.figure as IPoint[][]);
    }
}