import {EventEmitter} from "./event-emitter";
import {Actualizator} from "./actualizator";

export class BaseCell<T = any> extends EventEmitter<{
    change: { value: T, oldValue: T },
    error: Error,
}> {

    /** @internal **/
    public pull: () => T;
    dependencies: Set<BaseCell<any>>;
    private reactions: Set<BaseCell<any>>;
    private isActive = false;
    state: CellState = CellState.Actual;
    value: T;
    error: Error;

    constructor(value: T | (() => T)) {
        super();
        if (typeof value === "function") {
            this.pull = value as () => T;
            this.state = CellState.Dirty;
        } else {
            this.value = value;
            this.state = CellState.Actual;
        }
    }

    public get(): T {
        Actualizator.imCalled(this);
        switch (this.state) {
            case CellState.Dirty:
                Actualizator.Down(this);
                break;
        }
        if (this.error)
            throw this.error;
        return this.value;
    }

    public set(value: T) {
        if (this.compare(value, this.value))
            return;
        const oldValue = this.value;
        this.value = value;
        this.state = CellState.Actual;
        if (this.isActive)
            this.notifyChange(value, oldValue);
        if (this.reactions) {
            for (let reaction of this.reactions) {
                reaction.state = CellState.Dirty;
                Actualizator.Up(reaction);
            }
        }
    }

    protected compare(newValue: T, oldValue: T){
        return newValue === oldValue;
    }

    protected notifyChange(value: T, oldValue: T){
        const data = {oldValue, value, data: null}
        data.data = data;
        this.emit('change', data);
    }

    protected active() {
        this.isActive = true;
        Actualizator.Down(this);
    }

    protected disactive() {
        this.isActive = false;
        for (let dependency of this.dependencies) {
            dependency.removeReaction(this)
        }
        this.dependencies.clear();
    }

    protected subscribe(eventName: keyof { change: T }) {
        if (eventName == 'change')
            this.active();
    }

    protected unsubscribe(eventName: keyof { change: T }) {
        if (eventName == 'change' && !this.reactions)
            this.disactive();
    }

    addDependency(cell: BaseCell) {
        this.dependencies ??= new Set();
        this.dependencies.add(cell);
    }

    addReaction(cell: BaseCell) {
        this.reactions ??= new Set();
        this.reactions.add(cell);
    }

    removeReaction(cell: BaseCell) {
        this.reactions.delete(cell);
        if (!this.reactions.size) {
            this.reactions = null;
            if (!this.listeners.get('change')?.size)
                this.disactive();
        }
    }

}

export enum CellState {
    // value is actual
    Actual,
    // value is not actual, maybe will update
    Dirty,
}