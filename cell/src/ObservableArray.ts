import {EventEmitter, EventEmitterBase, Fn} from "@cmmn/core";
import {likeCell} from "./decorators";

@likeCell
export class ObservableArray<T> extends Array<T> {
    private emitter = new EventEmitter<{change: any}>();
    on = this.emitter.on.bind(this.emitter);

    constructor(arr: ArrayLike<T> = []) {
        super(arr.length);
        for (let i = 0; i < arr.length; i++) {
            this[i] = arr[i];
        }
    }
    emitChange(){
        this.emitter.emit('change', {value: this})
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
        this.emitChange();
        return res;
    } as any;
}
