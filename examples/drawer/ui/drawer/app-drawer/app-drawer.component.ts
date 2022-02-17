import {component, HtmlComponent, property} from "@cmmn/ui";
import {IEvents, IState, template} from "./app-drawer.template";
import style from "./app-drawer.style.less";
import {Cell, Injectable} from "@cmmn/core";
import {DrawingFigure, DrawingFigureFactory} from "../model";
import {DrawingFigureJson, Mode} from "../types";
import { services } from "../services";
import { ObservableList, ObservableMap } from "cellx-collections";
import {DrawingFigureBase} from "../model/drawing-figure-base";

@Injectable(true)
@component({name: 'app-drawer', template, style})
export class AppDrawerComponent extends HtmlComponent<IState, IEvents> {

    constructor() {
        super();
        this.Items.onChange(event => {
            const value = event.data.value as DrawingFigureJson;
            switch (event.data.subtype){
                case "add":
                    this.services.store.Items.set(value.id, DrawingFigureFactory(value));
                    break;
                case "delete":
                    this.services.store.Items.delete(value.id);
                    break;
                case "update":
                    this.services.store.Items.get(value.id).fromJson(value);
                    break;
            }
        });
        this.services.store.Items.onChange(event => {
            const value = event.data.value as DrawingFigure;
            switch (event.data.subtype){
                case "add":
                case "update":
                    this.Items.set(value.id, value.toJson());
                    break;
                case "delete":
                    this.Items.delete(value.id);
                    break;
            }
        });
    }
    public services = services(this);

    @property()
    public Items!: ObservableMap<string, DrawingFigureJson>

    @property()
    public Mode!: Cell<Mode>;

    get State() {
        return {
            Mode: this.Mode.get(),
            Items: this.services.store.Items.values(),
        }
    }

    public create() {
        this.services.creator.create();
    }
}
