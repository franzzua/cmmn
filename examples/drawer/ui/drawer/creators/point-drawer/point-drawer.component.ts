import {component, HtmlComponent, Pointer} from "@cmmn/ui";
import {IEvents, template} from "./point-drawer.template";
import style from "./point-drawer.style.less";
import {Fn, Injectable} from "@cmmn/core";
import {DrawingStore, PointItem} from "../../drawing.store";
import {CreatorService} from "../../services/creator.service";
import {ExtendedElement} from "@cmmn/ui/types";
import {AppDrawerComponent} from "../../app-drawer/app-drawer.component";
import {PointFigure} from "../../model/point-figure";

@Injectable(true)
@component({name: 'point-drawer', template, style})
export class PointDrawerComponent extends HtmlComponent<PointFigure, IEvents> {

    constructor(private store: DrawingStore,
                private creator: CreatorService) {
        super();
        this.onDispose = Pointer.on('directClick', event => {
            if (event.target !== this.appDrawer)
                return;
            this.creator.CreatingItem = this.creator.CreatingItemWithLastPosition;
            this.creator.create();
        });
        this.creator.CreatingItem = this.newItem();
    }

    private get appDrawer(): ExtendedElement<AppDrawerComponent> {
        return this.parentElement as ExtendedElement<AppDrawerComponent>;
    }

    private newItem = () => new PointFigure({
        type: 'point',
        id: Fn.ulid(),
        figure: null
    });

    get State(): PointFigure {
        return this.creator.CreatingItemWithLastPosition as PointFigure ?? (this.creator.CreatingItem = this.newItem());
    }
}
