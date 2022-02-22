import {component, HtmlComponent, property} from "@cmmn/ui";
import {IEvents, IState, LinePresentorTemplate} from "./line-presentor-template";
import style from "./line-figure.style.less";
import {Injectable} from "@cmmn/core";
import {BaseFigurePresentor} from "../base-figure-presentor";
import {LineFigure} from "../../model/line-figure";
import {DrawingItemType} from "../../types";

@Injectable(true)
@component({name: 'line-figure', template: LinePresentorTemplate, style, svg: true})
export class LinePresentor extends BaseFigurePresentor<IState, IEvents> {

    constructor() {
        super();
    }

    @property()
    public item!: LineFigure;

    get State() {
        return {
            start: this.item.figure.get(0) ?? {X:0,Y:0},
            points: this.item.figure,
            path: this.item.Path,
            hovered: !!this.item.hover,
            hoveredIndex: this.item.hover?.index,
            selected: !!this.item.selection,
            selectedIndex: this.item.selection?.index
        };
    }

}

BaseFigurePresentor.registration.set(DrawingItemType.line, LinePresentor);

