import {Cell} from "@cmmn/cell";
import { Fn } from "@cmmn/core";

export interface ILikeReactComponent<T> {
    setState(state: Partial<T>, callback?);
    setState(setter: (s: T) => T, callback?);
    componentDidMount?();
    componentWillUnmount?();
}

export function cellState<T>(self: ILikeReactComponent<T>, getters: {
    [key in keyof T]?: T[key] | (() => T[key]);
}, initial: Partial<T> = {}): T {
    let subscrsOrUnsubscrs = [];
    for (let key in getters) {
        if (typeof getters[key] !== "function") {
            initial[key] = getters[key] as any;
        } else {
            const cell = new Cell(getters[key]);
            subscrsOrUnsubscrs.push(() => cell.on('change', ({value}) => {
                self.setState({[key]: value as any} as Partial<T>);
            }));
            initial[key] = cell.get() as any;
        }
    }
    if (subscrsOrUnsubscrs.length){
        self.componentDidMount = Fn.join(self.componentDidMount, function (){
            subscrsOrUnsubscrs = subscrsOrUnsubscrs.map(fn => fn());
        });
        self.componentWillUnmount = Fn.join(self.componentWillUnmount, function (){
            subscrsOrUnsubscrs.forEach(fn => fn());
        });
    }
    return initial as T;
}