import {component, property} from "@cmmn/ui";
import {IEvents, IState, template} from "./point-figure.template";
import style from "./point-figure.style.less";
import {Injectable} from "@cmmn/core";
import {DrawingItemType} from "../../drawing.store";
import {BaseFigurePresentor} from "../base-figure-presentor";
import {HoverService} from "../../services/hover.service";
import {SelectionService} from "../../services/selection.service";
import {PointFigure} from "../../model/point-figure";

@Injectable(true)
@component({name: 'point-figure', template, style})
export class PointFigureComponent extends BaseFigurePresentor<IState, IEvents> {

    constructor(private hover: HoverService,
                private selection: SelectionService) {
        super();
    }

    @property()
    public item!: PointFigure;

    @property()
    public hovered!: boolean;

    get State() {
        return {
            point: this.item.figure,
            hovered: !!this.item.hover,
            selected: !!this.item.selection
        };
    }

}

BaseFigurePresentor.registration.set(DrawingItemType.point, PointFigureComponent);
