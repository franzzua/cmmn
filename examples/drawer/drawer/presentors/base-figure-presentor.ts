import {ExtendedElement, HtmlComponent, IEvents, Renderable, TemplateFunction} from "@cmmn/ui";
import {DrawingFigureBase} from "../model/drawing-figure-base";
import {DrawingFigure} from "../model";
import {DrawingItemType} from "../types";

export class BaseFigurePresentor<TState = any, TEvents extends IEvents = any> extends HtmlComponent<TState, TEvents> {

    public mode: string;

    public item!: DrawingFigureBase;

    private static Cache = new Map<string, ExtendedElement<BaseFigurePresentor<any, any>>>();

    public static registration = new Map<DrawingItemType, {
        new(...args): BaseFigurePresentor<any, any>
    }>();

    public static for(svg: TemplateFunction<Renderable>, item: DrawingFigure, options: object);
    public static for(svg: TemplateFunction<Renderable>, item: DrawingFigure);
    public static for(svg: TemplateFunction<Renderable>, item: DrawingFigure, options: object = null) {
        const g = svg`<g/>` as SVGGElement;
        const res = HtmlComponent.Extend<BaseFigurePresentor>(g, BaseFigurePresentor.registration.get(item.type))
        res.component.item = item;
        if (options) {
            Object.assign(res.component, options);
        }
        return res;
    }
}
