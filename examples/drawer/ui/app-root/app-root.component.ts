import {component, HtmlComponent, property} from "@cmmn/ui";
import {template, IState, IEvents} from "./app-root.template";
import style from "./app-root.style.less";
import {Injectable} from "@cmmn/core";
import {Mode} from "../drawer/types";
import { Observable } from "cellx-decorators";
import {DrawingStore} from "../drawer/drawing.store";

@Injectable(true)
@component({name: 'app-root', template, style})
export class AppRootComponent extends HtmlComponent<IState, IEvents> {

    constructor(private drawingStore: DrawingStore) {
        super();
        this.drawingStore.Items.onChange(event => {
        })
    }


    get State() {
        return {
            mode: this.drawingStore.Mode
        }
    }

    changeMode(mode: Mode){
        this.drawingStore.Mode = mode;
    }
}
