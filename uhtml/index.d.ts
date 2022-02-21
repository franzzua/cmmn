export type TemplateFunction<T> = {
    cache: Renderable;
} & ((
    template: TemplateStringsArray,
    ...values: any[]
) => T);

export interface Tag<T> extends TemplateFunction<Hole> {
    for(object: object, id?: string): TemplateFunction<T>;

    node: TemplateFunction<T>;
}

export type Renderable = {
    firstChild: HTMLElement | SVGElement;
    lastChild: HTMLElement | SVGElement;
} | HTMLElement | SVGElement;

export declare const html: Tag<HTMLElement>;
export declare const svg: Tag<SVGElement>;

export declare function render<T extends Node>(
    node: T,
    renderer: (() => Renderable) | Renderable | Hole,
): T;

export declare function unroll(info, {type, template, values}): Renderable;

/**
 * Used for internal purposes, should be created using
 * the `html` or `svg` template tags.
 */
export class Hole {
    constructor(type: string, template: TemplateStringsArray, values: any[]);

    readonly type: string;
    readonly template: TemplateStringsArray;
    readonly values: readonly any[];
}

/**
 * add custom handler for attributes in form (node, name) => newValue => { ** code ** }
 * should return handler for newValue or null
 *  * @param handler
 */
export function useCustomHandler(handler: (node: HTMLElement, name: string) => void): void;

export function setter(node: HTMLElement, name: string): void;