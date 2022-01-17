import {HtmlComponent} from "./htmlComponent";
import {Hole, TemplateFunction as UHtmlTemplateFunction} from "@cmmn/uhtml";

export type SingleArgumentsOf<TFunction> = TFunction extends (arg: infer T) => any ? T : void;

export type IEventHandler<TEvents> = {
    [K in keyof TEvents]: (mapping?: (Event: any) => SingleArgumentsOf<TEvents[K]>) => void;
};

export type ITemplate<TState, TEvents extends IEvents, TComponent extends HtmlComponent<TState, TEvents> = HtmlComponent<TState, TEvents>>
    = (this: TComponent, html: Html, state: TState, events: IEventHandler<TEvents>) => Hole;

export type SingleArg<F> = F extends (arg?: infer T) => any ? T : void;
export type IEvents = {
    [K: string]: (arg?: any) => void;
};

/**
 * Every time it will returns new html
 */
export type FreeHtml = (() => UHtmlTemplateFunction<Hole>);

/**
 * Every time a key change it will returns new html
 * It will stores html for every key: beware of memory leaks
 */
export type KeyedHtml = ((key: string | number) => UHtmlTemplateFunction<Hole>);

/**
 * Every time a key or object change it will returns new html
 * It will stores html for every key: beware of memory leaks
 */
export type ObjectKeyedHtml = <T>(object: ObjectNotArray<T>, key: string) => UHtmlTemplateFunction<Hole>;

export type Html = UHtmlTemplateFunction<Hole> & FreeHtml & KeyedHtml & ObjectKeyedHtml;

type ObjectNotArray<T> = T extends ReadonlyArray<string> ? never : T;