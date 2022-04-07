import {EventEmitter} from "@cmmn/core";
import {CellGraph} from "./cellGraph";
import {Actualizator} from "./actualizator";

export class Cell<T = any> extends EventEmitter<{
    change: { value: T, oldValue: T },
    error: Error,
}> {

    /** @internal **/
    public pull: () => T;
    private dependencies: Set<Cell<any>>;
    private reactions: Set<Cell<any>>;
    private isActive = false;
    private state: CellState = CellState.Actual;
    value: T;
    error: Error;

    constructor(value: T | (() => T), protected options?) {
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
        if (Actualizator.CurrentCell) {
            Actualizator.CurrentCell.addDependency(this);
            this.addReaction(Actualizator.CurrentCell);
        }
        switch (this.state) {
            case CellState.Dirty:
                this.actualize();
                break;
        }
        if (this.error)
            throw this.error;
        return this.value;
    }

    public set(value: T) {
        if (this.value == value)
            return;
        const oldValue = this.value;
        this.value = value;
        if (this.isActive)
            this.emit('change', {oldValue, value});
        if (this.reactions) {
            for (let reaction of this.reactions) {
                reaction.state = CellState.Dirty;
                Actualizator.Add(reaction);
            }
        }
    }

    protected active() {
        this.isActive = true;
        this.actualize();
    }

    protected disactive() {
        this.isActive = false;
        for (let dependency of this.dependencies) {
            dependency.removeReaction(this)
        }
        this.dependencies.clear();
    }

    protected subscribe(eventName: keyof { change: T }) {
        this.active();
    }

    protected unsubscribe(eventName: keyof { change: T }) {
        this.disactive();
    }

    protected actualize() {
        if (this.state == CellState.Actual)
            return;
        const oldDependencies = this.dependencies;
        this.dependencies = null;
        Actualizator.Process(this);
        if (oldDependencies) {
            for (let oldDependency of oldDependencies) {
                if (this.dependencies.has(oldDependency))
                    continue;
                oldDependency.removeReaction(this);
            }
        }
        this.state = CellState.Actual;
    }


    addDependency(cell: Cell) {
        this.dependencies ??= new Set();
        this.dependencies.add(cell);
    }

    addReaction(cell: Cell) {
        this.reactions ??= new Set();
        this.reactions.add(cell);
    }

    removeReaction(cell: Cell) {
        this.reactions.delete(cell);
        if (!this.reactions.size)
            this.disactive();
    }
}

export enum CellState {
    // value is actual
    Actual,
    // value is not actual, maybe will update
    Dirty,
}