import {ExtendedElement, HtmlComponent, IEvents} from "@cmmn/ui";
import {DrawingItem} from "../drawing.store";

export class BaseFigureComponent<TState, TEvents extends IEvents> extends HtmlComponent<TState, TEvents> {

    public mode: string;

    public item!: DrawingItem;

    private static Cache = new Map<string, ExtendedElement<BaseFigureComponent<any, any>>>();

    public static registration = new Map<DrawingItem["type"], {
        new(...args): BaseFigureComponent<any, any>
    }>();

    public static for(item: DrawingItem, options: object);
    public static for(item: DrawingItem);
    public static for(item: DrawingItem, options: object = null) {
        const res = BaseFigureComponent.Cache.getOrAdd(item.id, id => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            return HtmlComponent.Extend<BaseFigureComponent<any, any>>(g, BaseFigureComponent.registration.get(item.type));
        });
        res.item = item;
        if (options){
            Object.assign(res, options);
        }
        return res;
    }
}
