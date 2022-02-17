import {HtmlComponent} from "./htmlComponent";
import {CellRenderer} from "./cellRenderer";
import {ExtendedElement, IEvents, ITemplate, renderer} from "./types";
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

    public creatingElement: HTMLElement | SVGElement;

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
    style?: string,
    svg?: boolean
};

export function component<TState, TEvents extends IEvents = IEvents>(opts: IComponentOptions<TState, TEvents>) {
    return (target: any) => {
        target.Name = opts.name;
        target.Template = opts.template;

        class ProxyHTML extends HTMLElement {
            public component: HtmlComponent<TState, TEvents>;
            public [renderer]: CellRenderer<TState, TEvents>

            constructor() {
                super();
                HtmlComponent.Init(this, target);
            }

            connectedCallback() {
                Promise.resolve().then(() => {
                    this[renderer].Start();
                });
                this.component.connectedCallback();
            }

            attributeChangedCallback() {

            }

            disconnectedCallback() {
                this[renderer].Stop();
                this.component.onDisposeSet.forEach(x => x());
                this.component.onDisposeSet.clear();
            }

        }

        GlobalStaticState.addRegistration(() => {
            // @ts-ignore
            customElements.define(opts.name, ProxyHTML, {
                // @ts-ignore
                extends: opts.is
            });
            if (opts.style) {
                importStyle(opts.style, opts.name, target.name);
            }
        });
        return target;
    };
}
