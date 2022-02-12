import {component, HtmlComponent, property} from "@cmmn/ui";
import {template, IState, IEvents} from "./app-drawer.template";
import style from "./app-drawer.style.less";
import {Injectable} from "@cmmn/core";
import {DrawingStore} from "../drawing.store";
import {Mode} from "../types";

@Injectable(true)
@component({name: 'app-drawer', template, style})
export class AppDrawerComponent extends HtmlComponent<IState, IEvents> {

    constructor(private drawingStore: DrawingStore) {
        super();
    }


    get State() {
        return {
            Mode: Mode.line,
            Items: this.drawingStore.Items.toArray()
        }
    }
}
