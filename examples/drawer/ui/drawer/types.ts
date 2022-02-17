export enum Mode {
    idle = 1,
    point = 10,
    line = 11,
    polygone = 12,
    auto = 13
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