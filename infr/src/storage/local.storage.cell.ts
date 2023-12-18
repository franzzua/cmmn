import {Cell, ICellOptions, cell} from "@cmmn/cell";

type Storage<T> = {
    get(name: string): T;
    set(name: string, value: T);
}
const defaultStorage = {
    get(name){
        return JSON.parse(globalThis.localStorage.getItem(name) || "null")
    },
    set(name, value){
        globalThis.localStorage.setItem(name, JSON.stringify(value));
    }
}

export class LocalStorageCell<T> extends Cell<T> {
    constructor(name: string, options?: ICellOptions<T> & {
        storage?: Storage<T>
    }) {
        super((options.storage ?? defaultStorage).get(name), {
            ...options,
            onExternal: value => {
                (options.storage ?? defaultStorage).set(name, value);
                options.onExternal?.(value);
            }
        });

    }

}

export const cellLS = ((name: string, options?: ICellOptions<any> & {
    storage?: Storage<any>
}) => {
    return cell({
        startValue: (options.storage ?? defaultStorage).get(name),
        ...options,
        onExternal: value => {
            (options.storage ?? defaultStorage).set(name, value);
            options.onExternal?.(value);
        },
    })
})

