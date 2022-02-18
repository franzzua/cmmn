import {Injectable} from "@cmmn/core";
import {Observable} from "cellx-decorators";
import {ObservableMap} from "cellx-collections";
import {DrawingFigure} from "../model";
import {Mode} from "../types";
import type {AppDrawerComponent} from "../app-drawer/app-drawer.component";
import {KeyboardListener, PointerListener} from "@cmmn/ui";

@Injectable()
export class DrawingStore {

    constructor(private appDrawer: AppDrawerComponent) {
    }

    public pointer = new PointerListener(this.appDrawer.element as HTMLElement | SVGElement);
    public keyboard = new KeyboardListener(this.appDrawer.element as HTMLElement | SVGElement);

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



    public filterEvent(event: MouseEvent) {
        return event.target === this.appDrawer.element;
    }

}



