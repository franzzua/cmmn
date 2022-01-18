import {HtmlComponent} from "./htmlComponent";
import {CellRenderer} from "./cellRenderer";
import {Html, IEvents, ITemplate} from "./types";
import {Container} from "@cmmn/core";
import {importStyle} from "./importStyle";

export const GlobalStaticState = new class {
    _defaultContainer: Container = null;
    _registrations: Function[] = [];
    get DefaultContainer(): Container {
        return this._defaultContainer;
    };
    set DefaultContainer(value: Container) {
        this._defaultContainer = value;
        this._registrations.forEach(f => f());
        this._registrations.length = 0;
    };
    public creatingElement: HTMLElement

    addRegistration(registration: Function) {
        if (this.DefaultContainer)
            registration();
        else
            this._registrations.push(registration);
    }
};
export type IComponentOptions<TState, TEvents extends IEvents = IEvents> = {
    name: `${string}-${string}`,
    template: ITemplate<TState, TEvents>,
    style?: string
};

export function component<TState, TEvents extends IEvents = IEvents>(opts: IComponentOptions<TState, TEvents>) {
    return (target: any) => {
        if (opts.style) {
            importStyle(opts.style, opts.name, target.name);
        }
        const componentFactory = () => GlobalStaticState.DefaultContainer ? GlobalStaticState.DefaultContainer.get(target) : new target();
        const renderer = Symbol('renderer');

        class ProxyHTML extends HTMLElement {
            private component: HtmlComponent<TState, TEvents> = (() => {
                GlobalStaticState.creatingElement = this;
                const component = componentFactory();
                GlobalStaticState.creatingElement = undefined;
                return component as HtmlComponent<TState, TEvents>;
            })();
            private [renderer] = new CellRenderer(this.component, opts.template);

            constructor(...params: any[]) {
                super();
            }

            connectedCallback() {
                this[renderer].Start();
            }

            attributeChangedCallback() {

            }

            disconnectedCallback() {
                this[renderer].Stop();
            }
        }

        GlobalStaticState.addRegistration(() => {
            customElements.define(opts.name, ProxyHTML);
        });
        return target;
    };
}
