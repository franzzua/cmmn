import {component, HtmlComponent, Pointer} from "@cmmn/ui";
import {IEvents, template} from "./point-drawer.template";
import style from "./point-drawer.style.less";
import {Fn, Injectable} from "@cmmn/core";
import {CreatorService} from "../../services";
import {ExtendedElement} from "@cmmn/ui/types";
import {AppDrawerComponent} from "../../app-drawer/app-drawer.component";
import {PointFigure} from "../../model/point-figure";

@Injectable(true)
@component({name: 'point-drawer', template, style})
export class PointDrawerComponent extends HtmlComponent<PointFigure, IEvents> {

    constructor() {
        super();
        this.onDispose = Pointer.on('directClick', event => {
            if (event.target !== this.appDrawer)
                return;
            this.creator.CreatingItem = this.creator.CreatingItemWithLastPosition;
            this.creator.create();
        });
    }

    public get creator(): CreatorService {
        return this.appDrawer.component.services.creator;
    }

    private get appDrawer(): ExtendedElement<AppDrawerComponent> {
        return this.element.parentElement as ExtendedElement<AppDrawerComponent>;
    }

    private newItem = () => new PointFigure(Fn.ulid(), null);

    get State(): PointFigure {
        if (!this.creator.CreatingItem || !(this.creator.CreatingItem instanceof PointFigure))
            this.creator.CreatingItem = this.newItem();
        return this.creator.CreatingItemWithLastPosition as PointFigure;
    }
}
