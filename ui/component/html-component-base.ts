import {ExtendedElement, IEvents, ITemplate} from "./types";
import {Renderer} from "./renderer";
import {GlobalStaticState} from "./component";
import {listenSvgConnectDisconnect} from "./listen-svg-connect-disconnect";
import {HtmlComponent} from "./htmlComponent";
import {BoundRectListener} from "../user-events/boundRectListener";
import {EventEmitter} from "@cmmn/core";
import {effect, EffectFunction, SubscibeOnEffect} from "../extensions/effect";
import {action, ActionSubscribeType, SubcribeOnActions} from "../extensions/action";

export abstract class HtmlComponentBase<TState, TEvents extends IEvents = {}> extends EventEmitter<{
    render: { state: TState },
    dispose: void,
    connected: void
}> {
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
        // @ts-ignore
        if ('component' in element && element.component instanceof type)
            return element as ExtendedElement<TComponent>;
        const extElement = HtmlComponent.Init<TComponent>(element, type);
        element.setAttribute('is', type.Name);
        listenSvgConnectDisconnect(extElement);
        return extElement;
    }

    Events: TEvents = this as any;

    /** @internal **/
    private onDisposeSet = new Set<Function>();

    protected async init(){

    }
    public connectedCallback() {
        HtmlComponentBase.GlobalEvents.emit('connected', this);
        this.emit('connected');
        this.init();
    }

    public disconnectedCallback() {
        this.onDisposeSet.forEach(x => x());
        this.onDisposeSet.clear();
        this.emit('dispose');
        HtmlComponentBase.GlobalEvents.emit('disconnected', this);
        BoundRectListener.Unobserve(this.element);
    }

    public set onDispose(listener) {
        if (listener && typeof listener === "function")
            this.onDisposeSet.add(listener);
    }

    public onError(error, source: 'effect' | 'action' | 'state' | 'template', sourceName?) {
        console.groupCollapsed(this.constructor.name, `${source} ${sourceName ?? ''}`);
        console.warn(error);
        console.groupEnd()
    }

    static GlobalEvents = new EventEmitter<{
        disconnected: HtmlComponentBase<any, any>,
        connected: HtmlComponentBase<any, any>,
        render: { target: HtmlComponentBase<any, any>, state: any }
    }>();


    public static effect = effect;

    public static action = action;

    public get ClientRect(): { width; height; left; top; } {
        const listener = BoundRectListener.Observe(this.element)
        return listener.Rect;
    }

    protected async useAction(action, filter = () => null, subscribeAt: ActionSubscribeType = ActionSubscribeType.OnConnected){
        if (subscribeAt === ActionSubscribeType.OnConnected){
            await this.onceAsync('connected');
        }
        SubcribeOnActions(this, action, filter, subscribeAt);
    }

    protected useEffect(effect: EffectFunction<TState>, filter: (this: HtmlComponentBase<TState>, state: TState) => any = () => null){
        SubscibeOnEffect(this, effect, filter);
    }
}
