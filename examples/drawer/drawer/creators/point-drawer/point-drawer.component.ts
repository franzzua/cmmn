import {component, HtmlComponent} from "@cmmn/ui";
import {IEvents, template} from "./point-drawer.template";
import style from "./point-drawer.style.less";
import {Fn, Injectable} from "@cmmn/core";
import {CreatorService, DrawingStore} from "../../services";
import {ExtendedElement} from "@cmmn/ui/types";
import {AppDrawerComponent} from "../../app-drawer/app-drawer.component";
import {PointFigure} from "../../model/point-figure";
import {DrawingItemType} from "../../types";

@Injectable(true)
@component({name: 'point-drawer', template, style})
export class PointDrawerComponent extends HtmlComponent<PointFigure, IEvents> {

    connectedCallback() {
        this.onDispose = this.appDrawer.component.services.store.pointer.on('directClick', event => {
            this.creator.CreatingItem = this.creator.CreatingItemWithLastPosition;
            this.creator.create();
            this.creator.CreatingItem = this.newItem();
        });
        this.creator.CreatingItem = this.newItem();
        super.connectedCallback();
    }

    public get creator(): CreatorService {
        return this.appDrawer.component.services.creator;
    }

    private get appDrawer(): ExtendedElement<AppDrawerComponent> {
        return this.element.parentElement as ExtendedElement<AppDrawerComponent>;
    }

    private newItem = () => new PointFigure(Fn.ulid(), null);

    get State(): PointFigure {
        if (!this.creator.CreatingItem || this.creator.CreatingItem.type !== DrawingItemType.point)
            this.creator.CreatingItem = this.newItem();
        return this.creator.CreatingItemWithLastPosition as PointFigure;
    }
}
