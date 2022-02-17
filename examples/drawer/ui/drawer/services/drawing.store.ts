import {Injectable} from "@cmmn/core";
import {Observable} from "cellx-decorators";
import {ObservableMap} from "cellx-collections";
import {DrawingFigure} from "../model";
import {IPoint, Mode} from "../types";
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
        return this.appDrawer.Mode;
    }

    set Mode(value: Mode) {
        this.appDrawer.Mode = value;
    }

    @Observable
    Items = new ObservableMap<string, DrawingFigure>();


    public update(id: string) {
        this.Items.emit({
            type: ObservableMap.EVENT_CHANGE,
            target: this.Items,
            data: {
                subtype: 'update',
                key: id,
                value: this.Items.get(id),
                oldValue: this.Items.get(id),
            }
        });
    }


    public getRelativePoint(event: MouseEvent): IPoint{
        const rect = this.appDrawer.element.getBoundingClientRect();
        return  {
            X: event.pageX - rect.left,
            Y: event.pageY - rect.top
        }
    }
}



