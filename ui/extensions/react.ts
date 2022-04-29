import {Cell} from "@cmmn/cell";
import { Fn } from "@cmmn/core";

export interface ILikeReactComponent<T> {
    setState(state: Partial<T>, callback?);
    setState(setter: (s: T) => T, callback?);
    componentDidMount?();
    componentWillUnmount?();
}

export function useCellState<T>(self: ILikeReactComponent<T>, getters: {
    [key in keyof T]?: T[key] | (() => T[key]);
}, initial: Partial<T> = {}): T {
    let subscriptions = [];
    for (let key in getters) {
        if (typeof getters[key] !== "function") {
            initial[key] = getters[key] as any;
        } else {
            const cell = new Cell(getters[key]);
            subscriptions.push(() => cell.on('change', ({value}) => {
                self.setState({[key]: value as any} as Partial<T>);
            }));
            initial[key] = cell.get() as any;
        }
    }
    if (subscriptions.length){
        self.componentDidMount = Fn.join(self.componentDidMount, function (){
            subscriptions = subscriptions.map(fn => fn());
        });
        self.componentWillUnmount = Fn.join(self.componentWillUnmount, function (){
            subscriptions = subscriptions.map(fn => fn());
        });
    }
    return initial as T;
}