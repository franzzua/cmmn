import {EventEmitter, Fn} from "@cmmn/core";

type ArrayAndEventEmitter<T> = Array<T> & EventEmitter<{
    change: {value: Array<T>; }
    error: Error,
}>
interface ArrayAndEventEmitterConstructor {
    new(arrayLength?: number):  ArrayAndEventEmitter<any>;
    new <T = any>(values?: readonly T[] | null):  ArrayAndEventEmitter<T>;
    new <T>(arrayLength: number):  ArrayAndEventEmitter<T>;
    new <T>(...items: T[]):  ArrayAndEventEmitter<T>;
    <T>(arrayLength: number): ArrayAndEventEmitter<T>;
    <T>(...items: T[]):  ArrayAndEventEmitter<T>;
    readonly prototype: Array<any> & EventEmitter<any>;
}
declare var ArrayAndEventEmitter: ArrayAndEventEmitterConstructor;
// @ts-ignore
var ArrayAndEventEmitter = Fn.deepExtend(Array, EventEmitter) as any;


export class ObservableArray<T> extends ArrayAndEventEmitter<T> {

    emitChange(){
        this.emit('change', {value: this})
    }
    set(index, value:T){
        super[index] = value;
        this.emitChange();
    }
    insert(index, value:T){
        super.splice(index, 0, value);
        this.emitChange();
    }

    removeRange(index, count){
        super.splice(index, count);
        this.emitChange();
    }
    addRange(items: T[]){
        super.push(...items);
        this.emitChange();
    }
    removeAt(index){
        super.splice(index, 1);
        this.emitChange();
    }
    clear(){
        this.length = 0;
        this.emitChange();
    }

    [Symbol.iterator](): IterableIterator<T>{
        return super[Symbol.iterator]();
    }

}

const keys: Exclude<keyof Array<any>, keyof ReadonlyArray<any>>[] = [
    'pop', 'splice', 'push', 'sort', 'unshift',
// @ts-ignore
    'removeAll' ,'remove',
    'reverse', 'shift',  'fill'
];
for (let key of keys) {
    ObservableArray.prototype[key] = function (this: ObservableArray<any>, ...args){
        const res = Array.prototype[key].apply(this, args);
        this.emit('change', {value: this})
        return res;
    } as any;
}
