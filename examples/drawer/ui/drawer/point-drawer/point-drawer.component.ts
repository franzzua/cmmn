import {component, HtmlComponent, Pointer, property} from "@cmmn/ui";
import {IEvents, template} from "./point-drawer.template";
import style from "./point-drawer.style.less";
import {Fn, Injectable} from "@cmmn/core";
import {DrawingStore, PointItem} from "../drawing.store";
import { Observable } from "cellx-decorators";

@Injectable(true)
@component({name: 'point-drawer', template, style})
export class PointDrawerComponent extends HtmlComponent<PointItem, IEvents> {

    constructor(private store: DrawingStore) {
        super();
        Pointer.on('directClick', event => {
            store.add(this.State);
            this.itemId = Fn.ulid()
        });
        Pointer.on('dblClick', event => {
            store.add(this.State);
            this.itemId = Fn.ulid()
        });
    }

    @Observable
    private itemId!: string;

    get State(): PointItem {
        return Pointer.Position && {
            type: 'point',
            id: this.itemId,
            figure: {
                X: Pointer.Position.x,
                Y: Pointer.Position.y
            }
        };
    }
}
