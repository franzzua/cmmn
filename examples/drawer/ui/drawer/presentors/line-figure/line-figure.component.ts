import {component, Pointer, property} from "@cmmn/ui";
import {IEvents, IState, template} from "./line-figure.template";
import style from "./line-figure.style.less";
import {Injectable} from "@cmmn/core";
import {LineItem} from "../../drawing.store";
import {BaseFigureComponent} from "../base-figure-component";

@Injectable(true)
@component({name: 'line-figure', template, style, svg: true})
export class LineFigureComponent extends BaseFigureComponent<IState, IEvents> {

    constructor() {
        super();
    }
    @property()
    public item!: LineItem;

    get State() {
        return this.item;
    }
}

BaseFigureComponent.registration.set('line', LineFigureComponent);
