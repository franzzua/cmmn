import {component, HtmlComponent, property} from "@cmmn/ui";
import {IEvents, IState, template} from "./app-drawer.template";
import style from "./app-drawer.style.less";
import {bind, Injectable} from "@cmmn/core";
import {DrawingFigure, DrawingFigureFactory} from "../model";
import {DrawingFigureJson, Mode} from "../types";
import {services} from "../services";
import {ObservableMap} from "cellx-collections";
import {Observable} from "cellx-decorators";

@Injectable(true)
@component({name: 'app-drawer', template, style})
export class AppDrawerComponent extends HtmlComponent<IState, IEvents> {

    @bind
    private onLocalChange(event) {
        const value = event.data.value as DrawingFigure;
        switch (event.data.subtype) {
            case "add":
            case "update":
                this.Items.set(value.id, value.toJson());
                break;
            case "delete":
                this.Items.delete(event.data.key);
                break;
        }
    }

    @bind
    private onRemoteChange(event) {
        const value = event.data.value as DrawingFigureJson;
        switch (event.data.subtype) {
            case "add":
                if (!this.services.store.Items.has(value.id))
                    this.services.store.Items.set(value.id, DrawingFigureFactory(value));
                break;
            case "delete":
                this.services.store.Items.delete(event.data.key);
                break;
            case "update":
                this.services.store.Items.get(value.id).fromJson(value);
                break;
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.Items.onChange(this.onRemoteChange);
        this.services.store.Items = new ObservableMap(Array.from(this.Items).map(([id, item]) => [id, DrawingFigureFactory(item)]));
        this.services.store.Items.onChange(this.onLocalChange);
    }

    disconnectedCallback() {
        this.Items.offChange(this.onRemoteChange);
        this.services.store.Items.offChange(this.onLocalChange);
        super.disconnectedCallback();
    }

    public services = services(this);

    @property()
    public Items!: ObservableMap<string, DrawingFigureJson>

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
