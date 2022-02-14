import {component, Pointer, property} from "@cmmn/ui";
import {IEvents, IState, template} from "./point-figure.template";
import style from "./point-figure.style.less";
import {Injectable} from "@cmmn/core";
import {PointItem} from "../../drawing.store";
import {BaseFigureComponent} from "../base-figure-component";
import {HoverService} from "../../services/hover.service";
import {SelectionService} from "../../services/selection.service";

@Injectable(true)
@component({name: 'point-figure', template, style})
export class PointFigureComponent extends BaseFigureComponent<IState, IEvents> {

    constructor(private hover: HoverService,
                private selection: SelectionService) {
        super();
    }

    @property()
    public item!: PointItem;

    @property()
    public hovered!: boolean;

    get State() {
        return {
            item: this.item,
            hovered: this.hover.check(this.item),
            selected: this.selection.SelectedItems.contains(this.item)
        };
    }

}

BaseFigureComponent.registration.set('point', PointFigureComponent);
