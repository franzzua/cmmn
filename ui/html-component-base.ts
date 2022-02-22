import {ExtendedElement, IEvents, ITemplate} from "./types";
import {Renderer} from "./renderer";
import {GlobalStaticState} from "./component";
import {listenSvgConnectDisconnect} from "./listen-svg-connect-disconnect";
import {HtmlComponent} from "./htmlComponent";

export abstract class HtmlComponentBase<TState, TEvents extends IEvents = {}> {
    static Name: string;
    static Template: ITemplate<any, any>;

    public element: ExtendedElement<this>;

    public renderer: Renderer<TState, TEvents>;

    /** @internal **/
    static Init<TComponent extends HtmlComponent<any>>(element: HTMLElement | SVGElement, type = this as any): ExtendedElement<TComponent> {
        const componentFactory = () => GlobalStaticState.DefaultContainer ? GlobalStaticState.DefaultContainer.get<TComponent>(type) : new type();
        const component = componentFactory() as TComponent;
        component.element = element;
        component.renderer = new Renderer(component, type.Template);
        return Object.assign(element, {
            component,
        }) as ExtendedElement<TComponent>;
    }

    static Extend<TComponent extends HtmlComponent<any>>(element: HTMLElement | SVGElement, type = this as any): ExtendedElement<TComponent> {
        if ('component' in element)
            return element;
        const extElement = HtmlComponent.Init<TComponent>(element, type);
        element.setAttribute('is', type.Name);
        listenSvgConnectDisconnect(extElement);
        return extElement;
    }

    Events: TEvents = this as any;

    /** @internal **/
    private onDisposeSet = new Set<Function>();

    public connectedCallback() {
    }

    public disconnectedCallback() {
        this.onDisposeSet.forEach(x => x());
        this.onDisposeSet.clear();
    }

    protected set onDispose(listener) {
        this.onDisposeSet.add(listener);
    }

    get State(): TState {
        return null;
    }

    Actions: Function[] = [];
    /** @internal **/
    static Effects: {filter, effect}[];
    /** @internal **/
    public EffectValues = new Map<Function, any>();

    public static effect<TState>(filter: (state: TState) => any = () => null): MethodDecorator {
        return (target: {constructor: typeof HtmlComponent}, key, descr) => {
            if (!Object.getOwnPropertyDescriptor(target.constructor, 'Effect'))
                target.constructor.Effects = [];
            target.constructor.Effects.push({
                filter: filter,
                effect: descr.value as any
            });
            return descr;
        }
    }
}
