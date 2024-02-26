import {Cell, ICellOptions, cell} from "@cmmn/cell";

export type BaseStorage = {
    getItem(key: string): string;
    setItem(key: string, value: string): void;
}
export type Storage<T> = {
    get(name: string): T;
    set(name: string, value: T);
}
class DefaultStorage<T> implements Storage<T>{
    constructor(private base: BaseStorage) {
    }
    get(name){
        return JSON.parse(this.base.getItem(name) || "null")
    }
    set(name, value){
        this.base.setItem(name, JSON.stringify(value));
    }
}

export class StorageCell<T> extends Cell<T> {
    constructor(name: string, options?: ICellOptions<T> & {
        storage?: BaseStorage
    },  storage: Storage<T> = new DefaultStorage(options.storage ?? globalThis.localStorage)) {
        super(storage.get(name), {
            ...options,
            onExternal: value => {
                storage.set(name, value);
                options.onExternal?.(value);
            }
        });
    }
}

export const cellStorage = ((name: string, options?: ICellOptions<any> & {
    storage?: BaseStorage
},  storage: Storage<any> = new DefaultStorage(options.storage ?? globalThis.localStorage)) => {
    return cell({
        startValue: storage.get(name),
        ...options,
        onExternal: value => {
            storage.set(name, value);
            options.onExternal?.(value);
        },
    })
})

