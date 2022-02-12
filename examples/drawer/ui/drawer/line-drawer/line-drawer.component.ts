import {component, HtmlComponent, Pointer} from "@cmmn/ui";
import {IEvents, template} from "./line-drawer.template";
import style from "./line-drawer.style.less";
import {Fn, Injectable} from "@cmmn/core";
import {DrawingStore, IPoint, LineItem} from "../drawing.store";
import {Observable} from "cellx-decorators";
import { ObservableList } from "cellx-collections";

@Injectable(true)
@component({name: 'line-drawer', template, style})
export class LineDrawerComponent extends HtmlComponent<LineItem, IEvents> {

    constructor(private store: DrawingStore) {
        super();
        Pointer.on('directClick', event => {
            this.points.add({
                X: event.x,
                Y: event.y
            })
        })
        Pointer.on('dblClick', event => {
            this.store.add(this.State);
            this.itemId = Fn.ulid();
            this.points.clear();
        })
    }

    @Observable
    private points = new ObservableList<IPoint>([]);

    @Observable
    private itemId: string = Fn.ulid();

    get State(): LineItem {
        return Pointer.Position && {
            type: 'line',
            id: this.itemId,
            figure: [...this.points, {
                X: Pointer.Position.x,
                Y: Pointer.Position.y
            }]
        };
    }
}
