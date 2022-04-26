import {HtmlComponentBase} from "./html-component-base";
import {Fn} from "@cmmn/core";

type EffectFunction<TState> = (state: TState) => void | Function
type EffectInfo = {
    lastValue: any;
    unsubscr?: Function;
}
export function effect<TState>(filter: (this: HtmlComponentBase<TState>, state: TState) => any = () => null): MethodDecorator {
    return <T>(target: { constructor: typeof HtmlComponentBase }, key, descr) => {
        const effectFn = descr.value as EffectFunction<TState>;
        const effectValues = new Map<HtmlComponentBase<TState>, Map<EffectFunction<TState>, EffectInfo>>();
        target.constructor.GlobalEvents.on('connected', function (component: HtmlComponentBase<TState, any>) {
            if (!(component instanceof target.constructor))
                return;
            component.onDispose = component.on('render', async function (event: {state: TState }) {
                const value = filter.call(component, event.state);
                const values = effectValues.getOrAdd(component, () => new Map());
                let info = values.get(effectFn);
                if (!info)
                    values.set(effectFn, info = {lastValue: value})
                else if (Fn.compare(info.lastValue, value))
                    return;
                else
                    info.lastValue = value;
                if (info.unsubscr && typeof info.unsubscr === "function")
                    info.unsubscr();
                try {
                    info.unsubscr = await effectFn.call(component, value, event.state);
                } catch (e) {
                    component.onError(e, 'effect');
                }
            });
            component.on('dispose', ()=>{
                const values = effectValues.get(component);
                if (!values)
                    return;
                for (let info of values.values()) {
                    if (info.unsubscr && typeof info.unsubscr === "function")
                        info.unsubscr();
                }
            })
        });
        return descr;
    }
}