import {component, Pointer, property} from "@cmmn/ui";
import {IEvents, IState, template} from "./point-figure.template";
import style from "./point-figure.style.less";
import {Injectable} from "@cmmn/core";
import {PointItem} from "../../drawing.store";
import {BaseFigureComponent} from "../base-figure-component";

@Injectable(true)
@component({name: 'point-figure', template, style})
export class PointFigureComponent extends BaseFigureComponent<IState, IEvents> {

    constructor() {
        super();
    }

    @property()
    public item!: PointItem;

    get State() {
        return this.item;
    }
}

BaseFigureComponent.registration.set('point', PointFigureComponent);
