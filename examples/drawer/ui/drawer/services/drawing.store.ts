import {Injectable} from "@cmmn/core";
import {Observable} from "cellx-decorators";
import {ObservableList, ObservableMap} from "cellx-collections";
import {DrawingFigure} from "../model";
import {Mode} from "../types";
import type {AppDrawerComponent} from "../app-drawer/app-drawer.component";

@Injectable()
export class DrawingStore {

    constructor(private appDrawer: AppDrawerComponent) {
    }

    public async add(item: DrawingFigure) {
        await Promise.resolve(void 0);
        this.Items.set(item.id, item);
    }

    get Mode(): Mode {
        return this.appDrawer.Mode.get();
    }

    set Mode(value: Mode) {
        this.appDrawer.Mode.set(value);
    }

    @Observable
    Items = new ObservableMap<string, DrawingFigure>();

}



