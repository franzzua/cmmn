import {EventEmitter} from "@cmmn/core";

export class ObservableList<T> extends EventEmitter<{
    change: { value: T[] },
    splice: { index: number, deleteCount: number, values: T[] },
    push: { values: T[] },
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
        this.splice(index, 1, value);
    }
    push(...values: T[]){
        this.items.push(...values)
        this.emitChange();
        this.emit('push', {values});
    }

    splice(index: number, deleteCount: number, ...items: T[]){
        this.items.splice(index, deleteCount, ...items);
        this.emitChange();
        this.emit('splice', {index, deleteCount, values: items});
    }
    insert(index, value:T){
        this.splice(index, 0, value);
    }

    removeRange(index, count){
        this.splice(index, count);
    }
    update(items: T[]){
        this.splice(0, this.length, ...items);
    }
    removeAt(index){
        this.removeRange(index,1);
    }
    remove(item: T){
        this.removeAt(this.items.indexOf(item));
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