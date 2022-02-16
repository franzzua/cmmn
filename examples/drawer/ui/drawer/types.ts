export enum Mode {
    idle,
    point,
    line,
    polygone,
    auto
}

export enum DrawingItemType {
    point,
    line,
    polygone
}

export type IPoint = {
    X: number;
    Y: number;
}
export type PointInfo = {
    index?: number;
    contour?: number
}

export type DrawingFigureJson = {
    id: string;
    type: DrawingItemType;
    figure: IPoint | IPoint[] | IPoint[][];
}