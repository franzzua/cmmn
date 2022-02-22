import {component, HtmlComponent, property} from "@cmmn/ui";
import {IEvents, IState, AppDrawerTemplate} from "./app-drawer.template";
import style from "./app-drawer.style.less";
import {bind, Fn, Injectable} from "@cmmn/core";
import {DrawingFigure, DrawingFigureFactory} from "../model";
import {DrawingFigureJson, Mode} from "../types";
import {services} from "../services";
import {ObservableMap} from "cellx-collections";
import {Observable} from "cellx-decorators";

@Injectable(true)
@component({name: 'app-drawer', template: AppDrawerTemplate, style})
export class AppDrawerComponent extends HtmlComponent<IState, IEvents> {

    connectedCallback() {
        this.element.tabIndex = 0;
        this.element.focus();
        this.services = services(this);
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    public services: ReturnType<typeof services>;

    // @property()
    // public Items!: ObservableMap<string, DrawingFigureJson>

    @Observable
    public Mode: Mode = Mode.idle;

    get State() {
        return {
            Mode: this.Mode,
            Items: this.services.store.Items.values(),
        }
    }

    public create() {
        this.services.creator.create();
    }
}
