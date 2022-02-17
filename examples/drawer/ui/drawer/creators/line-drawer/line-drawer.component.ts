import {component, HtmlComponent, Pointer} from "@cmmn/ui";
import {IEvents, template} from "./line-drawer.template";
import style from "./line-drawer.style.less";
import {Fn, Injectable} from "@cmmn/core";
import {CreatorService} from "../../services/creator.service";
import {ExtendedElement} from "@cmmn/ui/types";
import {AppDrawerComponent} from "../../app-drawer/app-drawer.component";
import {LineFigure} from "../../model/line-figure";

@Injectable(true)
@component({name: 'line-drawer', template, style})
export class LineDrawerComponent extends HtmlComponent<LineFigure, IEvents> {

    connectedCallback(){
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
        this.creator.CreatingItem = this.newItem()
    }

    private get appDrawer(): ExtendedElement<AppDrawerComponent> {
        return this.element.parentElement as ExtendedElement<AppDrawerComponent>;
    }

    public get creator(): CreatorService {
        return this.appDrawer.component.services.creator;
    }

    private newItem = () => new LineFigure(Fn.ulid(), []);

    get State(): LineFigure {
        return this.creator.CreatingItemWithLastPosition as LineFigure;
    }
}
