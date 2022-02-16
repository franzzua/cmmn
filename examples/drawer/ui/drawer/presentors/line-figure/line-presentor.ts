import {component, property} from "@cmmn/ui";
import {IEvents, IState, template} from "./line-figure.template";
import style from "./line-figure.style.less";
import {Injectable} from "@cmmn/core";
import {BaseFigurePresentor} from "../base-figure-presentor";
import {LineFigure} from "../../model/line-figure";
import {DrawingItemType} from "../../types";

@Injectable(true)
@component({name: 'line-figure', template, style, svg: true})
export class LinePresentor extends BaseFigurePresentor<IState, IEvents> {

    constructor() {
        super();
    }

    @property()
    public item!: LineFigure;

    get State() {
        return {
            points: this.item.figure,
            path: this.toPath(),
            hovered: !!this.item.hover,
            hoveredIndex: this.item.hover?.index,
            selected: !!this.item.selection,
            selectedIndex: this.item.selection?.index
        };
    }


    public toPath() {
        if (this.item.figure.length < 2)
            return '';
        const [first, ...arr] = this.item.figure.map(p => `${p.X} ${p.Y}`);
        return `M${first}L ${arr.join(' ')}`;
    }
}

BaseFigurePresentor.registration.set(DrawingItemType.line, LinePresentor);
