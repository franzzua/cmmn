import {BaseCell, Cell} from "@cmmn/cell";
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
    const cells: Array<BaseCell<Partial<T>>> = [];
    for (let key in getters) {
        const getter =getters[key];
        if (typeof getter !== "function") {
            initial[key] = getters[key] as any;
        } else {
            const cell = new Cell<Partial<T>>(() => ({
                [key] : getter()
            } as Partial<T>));
            cells.push(cell);
            initial[key] = getter() as any;
        }
    }
    if (cells.length){
        self.componentDidMount = Fn.join(self.componentDidMount, function (){
            for (let cell of cells) {
                cell.on('change', ({value}) => {
                    self.setState(value);
                });
            }
        });
        self.componentWillUnmount = Fn.join(self.componentWillUnmount, function (){
            for (let cell of cells) {
                cell.dispose();
            }
        });
    }
    return initial as T;
}