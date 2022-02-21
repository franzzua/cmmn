import {component, HtmlComponent} from "@cmmn/ui";
import {IEvents, template} from "./line-drawer.template";
import style from "./line-drawer.style.less";
import {Fn, Injectable} from "@cmmn/core";
import {CreatorService} from "../../services/creator.service";
import {ExtendedElement} from "@cmmn/ui/types";
import {AppDrawerComponent} from "../../app-drawer/app-drawer.component";
import {LineFigure} from "../../model/line-figure";
import {DrawingItemType} from "../../types";
import {DrawingStore} from "../../services";

@Injectable(true)
@component({name: 'line-drawer', template, style})
export class LineDrawerComponent extends HtmlComponent<LineFigure, IEvents> {

    connectedCallback(){
        this.onDispose = this.appDrawer.component.services.store.pointer.on('dblclick', event => {
            this.creator.create();
            this.creator.CreatingItem = this.newItem()
        });

        let lastAddTime:number = null;

        this.onDispose = this.appDrawer.component.services.store.pointer.on('directClick', event => {
            if (lastAddTime && event.event.timeStamp - lastAddTime < 400)
                return;
            lastAddTime = event.event.timeStamp;
            this.creator.CreatingItem = this.creator.CreatingItemWithLastPosition;
        });
        this.creator.CreatingItem = this.newItem();
        super.connectedCallback();
    }

    private get appDrawer(): ExtendedElement<AppDrawerComponent> {
        return this.element.parentElement as ExtendedElement<AppDrawerComponent>;
    }

    public get creator(): CreatorService {
        return this.appDrawer.component.services.creator;
    }

    private newItem = () => new LineFigure(Fn.ulid(), []);

    get State(): LineFigure {
        if (!this.creator.CreatingItem || this.creator.CreatingItem.type !== DrawingItemType.line)
            this.creator.CreatingItem = this.newItem();
        return this.creator.CreatingItemWithLastPosition as LineFigure;
    }
}