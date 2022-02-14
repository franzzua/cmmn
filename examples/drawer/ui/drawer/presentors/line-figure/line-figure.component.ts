import {component, Pointer, property} from "@cmmn/ui";
import {IEvents, IState, template} from "./line-figure.template";
import style from "./line-figure.style.less";
import {Injectable} from "@cmmn/core";
import {LineItem} from "../../drawing.store";
import {BaseFigureComponent} from "../base-figure-component";
import {HoverService} from "../../services/hover.service";
import {SelectionService} from "../../services/selection.service";

@Injectable(true)
@component({name: 'line-figure', template, style, svg: true})
export class LineFigureComponent extends BaseFigureComponent<IState, IEvents> {

    constructor(private hover: HoverService,
                private selection: SelectionService) {
        super();
    }
    @property()
    public item!: LineItem;

    get State() {
        const hovered = this.hover.check(this.item);
        const selected = this.selection.SelectedItems.contains(this.item);
        return {
            item: this.item,
            hovered: hovered,
            hoveredIndex: this.hover.getHoveredPointIndex(this.item),
            selected: selected,
        };
    }
}

BaseFigureComponent.registration.set('line', LineFigureComponent);
