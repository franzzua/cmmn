import {ExtendedElement, HtmlComponent, IEvents} from "@cmmn/ui";
import {DrawingFigureBase} from "../model/drawing-figure-base";
import {DrawingFigure} from "../model";
import {DrawingItemType} from "../types";

export class BaseFigurePresentor<TState, TEvents extends IEvents> extends HtmlComponent<TState, TEvents> {

    public mode: string;

    public item!: DrawingFigureBase;

    private static Cache = new Map<string, ExtendedElement<BaseFigurePresentor<any, any>>>();

    public static registration = new Map<DrawingItemType, {
        new(...args): BaseFigurePresentor<any, any>
    }>();

    public static for(item: DrawingFigure, options: object);
    public static for(item: DrawingFigure);
    public static for(item: DrawingFigure, options: object = null) {
        const res = BaseFigurePresentor.Cache.getOrAdd(item.id, id => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            return HtmlComponent.Extend<BaseFigurePresentor<any, any>>(g, BaseFigurePresentor.registration.get(item.type));
        });
        res.component.item = item;
        if (options){
            Object.assign(res.component, options);
        }
        return res;
    }
}
