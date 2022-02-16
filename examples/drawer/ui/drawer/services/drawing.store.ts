import {Fn, Injectable} from "@cmmn/core";
import {Computed, Observable} from "cellx-decorators";
import {ObservableList} from "cellx-collections";
import {DrawingFigure, DrawingFigureFactory} from "../model";
import {DrawingFigureJson, Mode} from "../types";
import type {AppDrawerComponent} from "../app-drawer/app-drawer.component";

@Injectable()
export class DrawingStore {

    constructor(private appDrawer: AppDrawerComponent) {
    }

    public async add(item: DrawingFigure) {
        await Promise.resolve(void 0);
        this.Items.add(item);
        this.appDrawer.element.dispatchEvent(new CustomEvent<DrawingFigureJson>("add", {
            detail: item.toJson()
        }))
    }

    @Observable
    Mode: Mode = Mode.line;

    @Computed
    get Items(){
        return new ObservableList<DrawingFigure>(this.appDrawer.Items.map(DrawingFigureFactory));
    }

}



