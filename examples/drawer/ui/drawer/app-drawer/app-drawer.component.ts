import {component, HtmlComponent} from "@cmmn/ui";
import {IEvents, IState, template} from "./app-drawer.template";
import style from "./app-drawer.style.less";
import {Injectable} from "@cmmn/core";
import {DrawingStore} from "../drawing.store";

@Injectable(true)
@component({name: 'app-drawer', template, style})
export class AppDrawerComponent extends HtmlComponent<IState, IEvents> {

    constructor(private drawingStore: DrawingStore) {
        super();
    }

    get State() {
        return {
            Mode: this.drawingStore.Mode,
            Items: this.drawingStore.Items.toArray(),
        }
    }
}
