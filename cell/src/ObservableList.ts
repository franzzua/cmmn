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
    clear(){
        this.items.length = 0;
        this.emitChange();
    }


}