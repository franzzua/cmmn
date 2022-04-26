import {HtmlComponentBase} from "./html-component-base";
import {Fn} from "@cmmn/core";
import {Cell} from "@cmmn/cell";

type EffectFunction<TState> = (state: TState) => void | Function
type EffectInfo = {
    unsubscr?: Function;
}
export function action<TState>(filter: (this: any) => any = () => null): MethodDecorator {
    return <T>(target: { constructor: typeof HtmlComponentBase }, key, descr) => {
        const actionFn = descr.value as EffectFunction<TState>;
        const actionValues = new Map<HtmlComponentBase<TState>, Map<EffectFunction<TState>, EffectInfo>>();
        target.constructor.GlobalEvents.on('connected', function (component: HtmlComponentBase<TState, any>) {
            if (component.constructor !== target.constructor)
                return;
            component.onDispose = component.once('render',  async () => {
                const cell = new Cell(() => filter.call(component), {
                    compare: Fn.compare
                });
                const values = actionValues.getOrAdd(component, () => new Map());
                const info = values.getOrAdd(actionFn, () => ({}));

                const invokeAction = async ({value}) => {
                    if (info.unsubscr && typeof info.unsubscr === "function")
                        info.unsubscr();
                    try {
                        info.unsubscr = await actionFn.call(component, value);
                    } catch (e) {
                        component.onError(e, 'action', actionFn.name);
                    }
                }
                component.onDispose = cell.on('error', e => component.onError(e, 'action', actionFn.name))
                component.onDispose = cell.on('change', invokeAction);
                component.onDispose = () => {
                    if (info.unsubscr && typeof info.unsubscr === "function")
                        info.unsubscr();
                }
                try {
                    invokeAction({value: cell.get()})
                } catch (e) {
                    component.onError(e, 'action', actionFn.name);
                }
            });
        });
        return descr;
    }
}