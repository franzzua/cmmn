import {component, HtmlComponent, property} from "@cmmn/ui";
import {IEvents, IState, template} from "./app-drawer.template";
import style from "./app-drawer.style.less";
import {Injectable} from "@cmmn/core";
import {DrawingFigure} from "../model";
import {DrawingFigureJson, Mode} from "../types";
import { services } from "../services";

@Injectable(true)
@component({name: 'app-drawer', template, style})
export class AppDrawerComponent extends HtmlComponent<IState, IEvents> {

    constructor() {
        super();
    }
    public services = services(this);

    @property()
    public Items!: DrawingFigureJson[];

    @property()
    public Mode!: Mode;

    get State() {
        return {
            Mode: this.Mode,
            Items: this.services.store.Items.toArray(),
        }
    }

    public create() {
        this.services.creator.create();
    }
}
