import {component, HtmlComponent, Pointer} from "@cmmn/ui";
import {IEvents, template} from "./line-drawer.template";
import style from "./line-drawer.style.less";
import {Fn, Injectable, utc} from "@cmmn/core";
import {DrawingStore, LineItem} from "../../drawing.store";
import {Observable} from "cellx-decorators";
import {CreatorService} from "../../services/creator.service";
import {ExtendedElement} from "@cmmn/ui/types";
import {AppDrawerComponent} from "../../app-drawer/app-drawer.component";
import {LineFigure} from "../../model/line-figure";

@Injectable(true)
@component({name: 'line-drawer', template, style})
export class LineDrawerComponent extends HtmlComponent<LineFigure, IEvents> {

    constructor(private store: DrawingStore,
                private creator: CreatorService) {
        super();
        this.creator.CreatingItem = this.newItem();

        this.onDispose = Pointer.on('dblClick', event => {
            this.creator.create();
        });

        let lastAddTime:number = null;

        this.onDispose = Pointer.on('directClick', event => {
            if (event.target !== this.appDrawer)
                return;
            if (lastAddTime && event.timeStamp - lastAddTime < 400)
                return;
            lastAddTime = event.timeStamp;
            this.creator.CreatingItem = this.creator.CreatingItemWithLastPosition;
        });
    }

    private get appDrawer(): ExtendedElement<AppDrawerComponent> {
        return this.parentElement as ExtendedElement<AppDrawerComponent>;
    }

    private newItem = () => new LineFigure({
        type: 'line',
        id: Fn.ulid(),
        figure: []
    });

    get State(): LineFigure {
        return this.creator.CreatingItemWithLastPosition as LineFigure ?? (this.creator.CreatingItem = this.newItem());
    }
}
