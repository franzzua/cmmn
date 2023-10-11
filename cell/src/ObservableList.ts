import {EventEmitter} from "@cmmn/core";

export class ObservableList<T> extends EventEmitter<{
    change: { value: T[] },
    error: Error,
}>{
    constructor(private items: T[] = []) {
        super();
        for (let key of ['filter', 'indexOf', 'map', 'forEach', 'reduce', 'every', 'some', 'at', 'includes']) {
            this[key] = this.items[key].bind(this.items);
        }
    }

    get(index){
        return this.items[index];
    }

    toArray(){
        return this.items;
    }

    get length(){
        return this.items.length;
    }

    emitChange(){
        this.emit('change', {value: this.items})
    }
    set(index, value:T){
        this.items[index] = value;
        this.emitChange();
    }
    push(...values: T[]){
        this.items.push(...values)
        this.emitChange();
    }
    insert(index, value:T){
        this.items.splice(index, 0, value);
        this.emitChange();
    }

    removeRange(index, count){
        this.items.splice(index, count);
        this.emitChange();
    }
    addRange(items: T[]){
        this.items.push(...items);
        this.emitChange();
    }
    update(items: T[]){
        this.items = items;
        this.emitChange();
    }
    removeAt(index){
        this.removeRange(index,1);
        this.emitChange();
    }
    remove(item: T){
        this.removeAt(this.items.indexOf(item));
    }
    splice(index: number, deleteCnt: number, ...items: T[]){
        this.items.splice(index, deleteCnt, ...items);
        this.emitChange();
    }
    clear(){
        this.items.length = 0;
        this.emitChange();
    }

    filter: Array<T>["filter"];
    indexOf: Array<T>["indexOf"];
    map: Array<T>["map"];
    forEach: Array<T>["forEach"];
    reduce: Array<T>["reduce"];
    every: Array<T>["every"];
    some: Array<T>["some"];
    at: Array<T>["at"];
    includes: Array<T>["includes"];

}