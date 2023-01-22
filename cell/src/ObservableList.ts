import {EventEmitter} from "@cmmn/core";

export class ObservableList<T> extends EventEmitter<{
    change: { value: T[] },
    error: Error,
}>{
    constructor(private items: T[] = []) {
        super();
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

    filter: Array<T>["filter"] = this.items.filter.bind(this.items);
    indexOf: Array<T>["indexOf"] = this.items.indexOf.bind(this.items);
    map: Array<T>["map"] = this.items.map.bind(this.items);
    forEach: Array<T>["forEach"] = this.items.forEach.bind(this.items);
    reduce: Array<T>["reduce"] = this.items.reduce.bind(this.items);
    every: Array<T>["every"] = this.items.every.bind(this.items);
    some: Array<T>["some"] = this.items.some.bind(this.items);
    at: Array<T>["at"] = this.items.at.bind(this.items);

}