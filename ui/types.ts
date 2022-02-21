import {HtmlComponent} from "./htmlComponent";
import {Hole, Renderable, TemplateFunction} from "@cmmn/uhtml";

export type SingleArgumentsOf<TFunction> = TFunction extends (arg: infer T) => any ? T : void;

export type IEventHandler<TEvents> = {
    [K in keyof TEvents]: (mapping?: (Event: any) => SingleArgumentsOf<TEvents[K]>) => void;
};

export type ITemplate<TState, TEvents extends IEvents, TComponent extends HtmlComponent<TState, TEvents> = HtmlComponent<TState, TEvents>>
    = (this: TComponent, html: Html, state: TState, events: IEventHandler<TEvents>) => Renderable;

export type SingleArg<F> = F extends (arg?: infer T) => any ? T : void;
export type IEvents = {
    [K: string]: (arg?: any) => void;
};

/**
 * Every time it will returns new html
 */
export type FreeHtml = (() => TemplateFunction<Renderable>);

/**
 * Every time a key change it will returns new html
 * It will stores html for every key: beware of memory leaks
 */
export type KeyedHtml = ((key: string | number) => TemplateFunction<Renderable>);

/**
 * Every time a key or object change it will returns new html
 * It will stores html for every key: beware of memory leaks
 */
export type ObjectKeyedHtml = <T>(object: ObjectNotArray<T>, key: string) => TemplateFunction<Renderable>;

export type Html = TemplateFunction<Renderable> & FreeHtml & KeyedHtml & ObjectKeyedHtml & {
    svg: Html;
};
export {Renderable, Hole, TemplateFunction};

type ObjectNotArray<T> = T extends ReadonlyArray<string> ? never : T;

export type ExtendedElement<TComponent = HtmlComponent<any, any>> = (SVGElement | HTMLElement) & {
    component?: TComponent;
};
