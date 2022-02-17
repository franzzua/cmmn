import {component, ExtendedElement, HtmlComponent} from "@cmmn/ui";
import {IEvents, IState, template} from "./app-root.template";
import style from "./app-root.style.less";
import {Cell, Injectable} from "@cmmn/core";
import {DrawingFigureJson, Mode} from "../drawer/types";
import {AppDrawerComponent} from "../drawer";
import {DrawingStore} from "../services/drawing.store";

@Injectable(true)
@component({name: 'app-root', template, style})
export class AppRootComponent extends HtmlComponent<IState, IEvents> {

    constructor(private drawingStore: DrawingStore) {
        super();
    }

    get drawer() {
        return (this.element.children.namedItem('drawer') as ExtendedElement<AppDrawerComponent>).component;
    }

    private mode = new Cell(Mode.line);

    get State() {
        return {
            mode: this.mode,
            items: this.drawingStore.Items,
        }
    }

    changeMode(mode: Mode) {
        if (this.mode.get() == Mode.line) {
            this.drawer.create();
        } else {
            this.drawer.services.creator.cancel();
        }
        this.mode.set(mode);
    }

}

