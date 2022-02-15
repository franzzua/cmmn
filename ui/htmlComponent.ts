import {GlobalStaticState} from "./component";
import {ExtendedElement, IEvents, ITemplate, renderer} from "./types";
import {Cell} from "@cmmn/core";
import {CellRenderer} from "./cellRenderer";
import {listenSvgConnectDisconnect} from "./listen-svg-connect-disconnect";

export abstract class HtmlComponent<TState, TEvents extends IEvents = {}> extends HTMLElement {
    static Name: string;
    static Template: ITemplate<any, any>;

    /** @internal **/
    static Init<TComponent extends HtmlComponent<any>>(element: HTMLElement | SVGElement, type = this as any): ExtendedElement<TComponent> {
        const componentFactory = () => GlobalStaticState.DefaultContainer ? GlobalStaticState.DefaultContainer.get<TComponent>(type) : new type();
        GlobalStaticState.creatingElement = element;
        const component = componentFactory();
        GlobalStaticState.creatingElement = undefined;
        return Object.assign(element, {
            component,
            [renderer]: new CellRenderer(component, type.Template)
        }) as ExtendedElement<TComponent>;
    }

    static Extend<TComponent extends HtmlComponent<any>>(element: HTMLElement | SVGElement, type = this as any): ExtendedElement<TComponent> {
        const extElement = HtmlComponent.Init<TComponent>(element, type);
        element.setAttribute('is', type.Name);
        listenSvgConnectDisconnect(extElement);
        return extElement;
    }

    Events: TEvents;

    $state: Cell<TState>;
    /** @internal **/
    public onDisposeSet = new Set<Function>();

    protected set onDispose(listener) {
        this.onDisposeSet.add(listener);
    }

    get State(): TState {
        return this.$state.get();
    }

    /** @internal **/
    public $render: Cell<number>;

    Actions: Function[] = [];
    Effects: Function[] = [];
}

const HtmlComponentImpl = Object.assign(function () {
    const element = GlobalStaticState.creatingElement;
    // @ts-ignore
    this.__proto__.__proto__ = element.__proto__;
    // @ts-ignore
    element.__proto__ = this.__proto__;
    this.Events = this;
    this.Actions = [];
    this.Effects = [];
    this.onDisposeSet = new Set();
    Object.defineProperty(element, 'onDispose', {
        set(fn) {
            this.onDisposeSet.add(fn);
        }
    })
    Object.assign(element, this);
    return element;
}, {
    Extend: HtmlComponent.Extend,
    Init: HtmlComponent.Init
})

// @ts-ignore
HtmlComponent = HtmlComponentImpl as any;
