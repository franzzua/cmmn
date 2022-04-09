import {EventEmitter} from "./event-emitter";

export class ObservableList<T> extends EventEmitter<{
    change: { value: T, oldValue: T },
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

    set(index, value:T){
        this.items[index] = value;
    }
    insert(index, value:T){
        this.items.splice(index, 0, value);
    }

    removeRange(index, count){
        this.items.splice(index, count);
    }
    addRange(items: T[]){
        this.items.push(...items);
    }
    update(items: T[]){
        this.items = items;
    }
    removeAt(index){
        this.removeRange(index,1);
    }
    clear(){
        this.items.length = 0;
    }


}