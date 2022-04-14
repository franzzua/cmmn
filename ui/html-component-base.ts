import {ExtendedElement, IEvents, ITemplate} from "./types";
import {Renderer} from "./renderer";
import {GlobalStaticState} from "./component";
import {listenSvgConnectDisconnect} from "./listen-svg-connect-disconnect";
import {HtmlComponent} from "./htmlComponent";
import {BoundRectListener} from "./boundRectListener";
import {Cell} from "@cmmn/cell";
import {Fn} from "@cmmn/core";

export abstract class HtmlComponentBase<TState, TEvents extends IEvents = {}> {
    static Name: string;
    static Template: ITemplate<any, any>;

    public element: ExtendedElement<this> = GlobalStaticState.creatingElement;

    public renderer: Renderer<TState, TEvents>;

    /** @internal **/
    static Init<TComponent extends HtmlComponent<any>>(element: HTMLElement | SVGElement, type = this as any): ExtendedElement<TComponent> {
        const componentFactory = () => GlobalStaticState.DefaultContainer ? GlobalStaticState.DefaultContainer.get<TComponent>(type) : new type();
        GlobalStaticState.creatingElement = element;
        const component = componentFactory() as TComponent;
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

    public set onDispose(listener) {
        if (listener && typeof listener === "function")
            this.onDisposeSet.add(listener);
    }

    public onError(error, source: 'effect' | 'action' | 'state' | 'template') {
        console.warn(this, source, error);
    }

    /** @internal **/
    public async RunEffects(state: TState) {
        const effects = (this.constructor as typeof HtmlComponentBase).Effects;
        if (effects?.length) {
            for (let effect of effects) {
                const value = effect.filter(state);
                if (this.EffectValues.has(effect.effect)) {
                    const lastValue = this.EffectValues.get(effect.effect);
                    if (Fn.compare(lastValue, value))
                        continue;
                }
                this.EffectValues.set(effect.effect, value);
                if (effect.unsubscr && typeof effect.unsubscr === "function")
                    effect.unsubscr();
                try {
                    effect.unsubscr = await effect.effect.call(this, value, state);
                } catch (e) {
                    this.onError(e, 'effect');
                }
            }
        }
    }

    /** @internal **/
    @HtmlComponentBase.effect()
    public SubscribeActions() {
        const actions = (this.constructor as typeof HtmlComponentBase).Actions ?? [];
        for (let action of actions) {
            // TODO: unsubscribe
            const cell = new Cell(() => action.filter.call(this), {
                compare: Fn.compare
            });
            const invokeAction = async ({value}) => {
                if (action.unsusbscr && typeof action.unsusbscr === "function")
                    action.unsusbscr();
                try {
                    action.unsusbscr = await action.action.call(this, value);
                } catch (e) {
                    this.onError(e, 'action');
                }
            }
            this.onDispose = cell.on('change', invokeAction);
            this.onDispose = () => {
                if (action.unsusbscr && typeof action.unsusbscr === "function")
                    action.unsusbscr();
                cell.off('change', invokeAction);
            }
            invokeAction({value: cell.get()})
        }
    }


    /** @internal **/
    static Effects: { filter, effect, unsubscr?: Function }[];
    /** @internal **/
    static Actions: { filter, action, unsusbscr?: Function }[];
    /** @internal **/
    public EffectValues = new Map<Function, any>();
    /** @internal **/
    public ActionValues = new Map<Function, any>();

    public static effect<TState>(filter: (this: any, state: TState) => any = () => null): MethodDecorator {
        return (target: { constructor: typeof HtmlComponent }, key, descr) => {
            if (!Object.getOwnPropertyDescriptor(target.constructor, 'Effects'))
                target.constructor.Effects = [];
            target.constructor.Effects.push({
                filter: filter,
                effect: descr.value as any
            });
            return descr;
        }
    }

    public static action<TState>(filter: (this: any) => any = () => null): MethodDecorator {
        return (target: { constructor: typeof HtmlComponent }, key, descr) => {
            if (!Object.getOwnPropertyDescriptor(target.constructor, 'Actions'))
                target.constructor.Actions = [];
            target.constructor.Actions.push({
                filter: filter,
                action: descr.value as any
            });
            return descr;
        }
    }

    public get ClientRect(): { width; height; left; top; } {
        const listener = BoundRectListener.GetInstance(this.element)
        return listener.Rect;
    }
}
