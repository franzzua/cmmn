import {EventEmitter} from "./event-emitter";
import {Actualizator} from "./actualizator";

function getDebugName(){
    try{
        throw new Error();
    }catch (e){
        const sources = e.stack.split('\n').slice(2);
        return sources.map(s => {
            const m = s.match(/at\s?(new )?(.*)\s+\(/);
            if (!m) return null;
            return m[2];
        }).filter(x => x)
            .distinct()
            .filter(x => !x.match(/BaseCell|Cell/))
            .join(' ')
    }
}

export class BaseCell<T = any> extends EventEmitter<{
    change: { value: T, oldValue: T },
    error: Error,
}> {

    /** @internal **/
    public pull: () => T;
    dependencies: Set<BaseCell<any>>;
    private reactions: Set<BaseCell<any>>;
    isActive = false;
    state: CellState = CellState.Actual;
    value: T;
    error: Error;
    // debug = getDebugName();

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

    public setError(error: Error){
        this.error = error;
        this.value = undefined;
        this.state = CellState.Actual;
        if (this.isActive)
            this.emit('error', this.error);
        if (this.reactions) {
            for (let reaction of this.reactions) {
                reaction.state = CellState.Dirty;
                Actualizator.Up(reaction);
            }
        }
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
        const data = {oldValue, value};
        this.emit('change', data);
    }

    active() {
        this.isActive = true;

        Actualizator.Down(this);
    }

    protected disactive() {
        this.isActive = false;
        if (this.dependencies) {
            for (let dependency of this.dependencies) {
                dependency.removeReaction(this)
            }
            this.dependencies = null;
        }
        if (this.pull) {
            this.state = CellState.Dirty;
        }
    }

    protected subscribe(eventName: keyof { change: T }) {
        if (eventName == 'change' && !this.isActive)
            this.active();
    }

    protected unsubscribe(eventName: keyof { change: T }) {
        if (eventName == 'change' && !this.reactions && this.isActive)
            this.disactive();
    }

    addDependency(cell: BaseCell) {
        this.dependencies ??= new Set();
        this.dependencies.add(cell);
    }

    addReaction(cell: BaseCell) {
        this.reactions ??= new Set();
        this.reactions.add(cell);
        if (!this.isActive)
            this.active();
    }

    removeReaction(cell: BaseCell) {
        this.reactions.delete(cell);
        if (!this.reactions.size) {
            this.reactions = null;
            if (this.isActive && !this.listeners.get('change')?.size)
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