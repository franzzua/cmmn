import {component, HtmlComponent, Pointer} from "@cmmn/ui";
import {IEvents, template} from "./line-drawer.template";
import style from "./line-drawer.style.less";
import {Fn, Injectable, utc} from "@cmmn/core";
import {DrawingStore, LineItem} from "../drawing.store";
import {Observable} from "cellx-decorators";

@Injectable(true)
@component({name: 'line-drawer', template, style})
export class LineDrawerComponent extends HtmlComponent<LineItem, IEvents> {

    constructor(private store: DrawingStore) {
        super();

        this.onDispose = Pointer.on('dblClick', event => {
            this.store.create();
        });

        let lastAddTime:number = null;

        this.onDispose = Pointer.on('directClick', event => {
            if (lastAddTime && event.timeStamp - lastAddTime < 400)
                return;
            lastAddTime = event.timeStamp;
            (this.store.CreatingItem as LineItem).figure.push({
                X: event.x,
                Y: event.y
            });
        });
    }

    private newItem = () => ({
        type: 'line',
        id: Fn.ulid(),
        figure: []
    } as LineItem);

    get State(): LineItem {
        return this.store.CreatingItemWithLastPosition as LineItem ?? (this.store.CreatingItem = this.newItem());
    }
}
