import {component, HtmlComponent, Pointer} from "@cmmn/ui";
import {IEvents, template} from "./point-drawer.template";
import style from "./point-drawer.style.less";
import {Fn, Injectable} from "@cmmn/core";
import {DrawingStore, PointItem} from "../drawing.store";

@Injectable(true)
@component({name: 'point-drawer', template, style})
export class PointDrawerComponent extends HtmlComponent<PointItem, IEvents> {

    constructor(private store: DrawingStore) {
        super();
        this.onDispose = Pointer.on('directClick', event => {
            this.store.create();
        });
    }

    private newItem = () => ({
        type: 'point',
        id: Fn.ulid(),
        figure: null
    } as PointItem);

    get State(): PointItem {
        return this.store.CreatingItemWithLastPosition as PointItem ?? (this.store.CreatingItem = this.newItem());
    }
}
