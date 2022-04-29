import {HtmlComponentBase} from "../component/html-component-base";
import {Fn} from "@cmmn/core";
import {Cell} from "@cmmn/cell";

type EffectFunction<TState> = (state: TState) => void | Function
type EffectInfo = {
    unsubscr?: Function;
}
export function action<TState>(filter: (this: any) => any = () => null, subscribeAt: ActionSubscribeType = ActionSubscribeType.OnConnected): MethodDecorator {
    return <T>(target: { constructor: typeof HtmlComponentBase }, key, descr) => {
        const actionFn = descr.value as EffectFunction<TState>;
        target.constructor.GlobalEvents.on('connected', function (component: HtmlComponentBase<TState, any>) {
            if (!(component instanceof target.constructor))
                return;
            SubcribeOnActions(component, actionFn, filter, subscribeAt);
        });
        return descr;
    }
}
const actionsSymbol = Symbol('ActionValues');

/** @internal **/
export function SubcribeOnActions<TState>(component: HtmlComponentBase<TState>, actionFn, filter, subscribeAt){
    const actionValues = component[actionsSymbol] ??= new Map<HtmlComponentBase<TState>, Map<EffectFunction<TState>, EffectInfo>>();
    async function actionSubscribe(){
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
    }
    switch (subscribeAt){
        case ActionSubscribeType.OnConnected:
            actionSubscribe();
            break;
        case ActionSubscribeType.OnFirstRender:
            component.onDispose = component.once('render',  actionSubscribe);
            break;
    }
}

export enum ActionSubscribeType {
    OnConnected = 1,
    OnFirstRender = 2
}

