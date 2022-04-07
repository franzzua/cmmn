import {bind, Fn, ResolvablePromise} from "@cmmn/core";
import {Renderable, TemplateFunction} from "@cmmn/uhtml";
import {IEvents, ITemplate} from "./types";
import {EventHandlerProvider} from "./eventHandlerProvider";
import {HtmlComponentBase} from "./html-component-base";
import {getRender, getTemplate} from "./template";
import {AnimationFrameListener} from "./animationFrameListener";

export class Renderer<TState, TEvents extends IEvents> {
    // private stateCell: Cell<TState> = this.component.$state ?? cellx(() => this.stopped ? null : this.component.State).cell;
    // private actionsCells = this.component.Actions.map(action => cellx(() => {
    //     // const renderTime = this.renderCell.get();
    //     action();
    // }));
    // private effectCells = this.component.Effects.map(action => cellx(() => {
    //     if (!this.component.$render.get())
    //         return;
    //     action();
    // }));
    private cache = new Map<object, Map<string, { cache: Renderable } & TemplateFunction<Renderable>>>();
    private eventHandler = new EventHandlerProvider(this.component);

    constructor(private component: HtmlComponentBase<TState, TEvents>,
                private template: ITemplate<TState, TEvents>) {
    }

    private cacheFor(target, key, factory) {
        return this.cache.getOrAdd(target, () => new Map()).getOrAdd(key, factory);
    }

    private getRenderFor = (type) => (target, ...keys) => {
        if (target === undefined) {
            return getTemplate(type)
        }
        if (typeof target === "string" || typeof target === "number") {
            const key = target + '.' + keys.join('.');
            return this.cacheFor(this, key, key => getTemplate(type));
        }
        return this.cacheFor(target, keys.join('.'), key => getTemplate(type));
    }

    private getRender(type) {
        const render = getRender(type, this.component.element)
        render.for = this.getRenderFor(type);
        return Object.assign((template: any, ...values) => {
            if (Array.isArray(template))
                return render(template as any, ...values);
            return render.for(template, ...values);
        },{
            for: render.for
        });
    }

    private html = Object.assign(this.getRender('html'), {
        svg: this.getRender('svg')
    });

    handlerProxy = new Proxy({}, {
        get: (target, key) => {
            return this.eventHandler.getEventHandler(key as keyof TEvents);
        }
    });


    static renderTasks = new Set<Renderer<any, any>>();

    static isRendering = false;

    static Render() {
        for (let renderer of Renderer.renderTasks) {
            renderer._render();
        }
        Renderer.renderTasks.clear();
        AnimationFrameListener.Instance.off('frame', Renderer.Render);
    }


    private state: TState;

    async _render() {
        this.template.call(this.component, this.html, this.state, this.handlerProxy);
        if (this.renderedTask) {
            this.renderedTask.resolve();
            await this.renderedTask;
        }
        const effects = (this.component.constructor as typeof HtmlComponentBase).Effects;
        if (effects?.length) {
            for (let effect of effects) {
                const value = effect.filter(this.state);
                if (this.component.EffectValues.has(effect.effect)) {
                    const lastValue = this.component.EffectValues.get(effect.effect);
                    if (Fn.compare(lastValue, value))
                        continue;
                }
                this.component.EffectValues.set(effect.effect, value);
                effect.effect.call(this.component, value, this.state);
            }
        }
    }

    private renderedTask: ResolvablePromise;

    @bind
    render(state) {
        this.state = state;
        AnimationFrameListener.Instance.on('frame', Renderer.Render);
        Renderer.renderTasks.add(this);
        this.renderedTask ??= new ResolvablePromise();
        return this.renderedTask;
        // });
    }

    dispose() {
        for (let x of this.cache.values()) {
            for (let y of x.values()) {
                console.log(y.cache);
            }
        }
    }

}

