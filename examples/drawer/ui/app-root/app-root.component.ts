import {component, HtmlComponent} from "@cmmn/ui";
import {IEvents, IState, template} from "./app-root.template";
import style from "./app-root.style.less";
import {Injectable} from "@cmmn/core";
import {Mode} from "../drawer/types";
import {DrawingStore} from "../drawer/drawing.store";
import {CreatorService} from "../drawer/services/creator.service";

@Injectable(true)
@component({name: 'app-root', template, style})
export class AppRootComponent extends HtmlComponent<IState, IEvents> {

    constructor(private drawingStore: DrawingStore,
                private creator: CreatorService) {
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
        if (this.drawingStore.Mode == Mode.line) {
            this.creator.create();
        }
        this.drawingStore.Mode = mode;
    }
}
