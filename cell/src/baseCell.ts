import {EventEmitter, EventEmitterBase} from '@cmmn/core';
import {getDebugName} from './util/debug-name';
import {Actualizator} from './actualizator';

export class BaseCell<T = any> extends EventEmitter<{
    change: { value: T, oldValue: T },
    error: Error,
}> {

    /** @internal **/
    pull: () => T;
    value: T;
    error: Error;
    dependencies: Set<BaseCell<any>>; // cells on which this cell depends
    private reactions: Set<BaseCell<any>>; // cells dependent on this cell
    isPulling = false;
    isActive = false;
    state: CellState;
    debug = getDebugName(/BaseCell|Cell/);

    constructor(value: T | (() => T)) {
        super();
        if (typeof value === "function") {
            this.pull = value as () => T;
            this.state = CellState.Dirty;
        } else {
            this.value = value;
            if (value instanceof EventEmitterBase) {
                value.on('change', this.onValueContentChanged);
            }
            this.state = CellState.Actual;
        }
    }

    public get(): T {
        if (this.isPulling) {
            throw new CyclicalPullError(this);
        }
        Actualizator.imCalled(this);
        if (this.state === CellState.Dirty) {
            Actualizator.Down(this);
        }
        if (this.error)
            throw this.error;
        return this.value;
    }

    /** @internal **/
    public setInternal(value: T) {
        if (this.compare(value))
            return;
        this.update(value);
    }

    public set(value: T) {
        this.setInternal(value);
    }

    protected onValueContentChanged = (change) => {
        this.update(this.value); // e.g. adding a new element to ObservableMap
    }

    public setError(error: Error) {
        this.update(undefined, error);
    }

    /**
     * Called when only one of the changes has occurred:
     *  - cell value changed;
     *  - OR the content of the cell value has changed;
     *  - OR an error has occurred.
     */
    protected update(value: T, error?: Error) {
        this.error = error;
        const oldValue = this.value;
        this.value = value;
        if (this.isActive) {
            this.state = CellState.Actual;
        }
        if (oldValue !== value) {
            if (oldValue instanceof EventEmitterBase) {
                oldValue.off('change', this.onValueContentChanged);
            }
            if (value instanceof EventEmitterBase) {
                value.on('change', this.onValueContentChanged);
            }
        }
        if (error)
            this.emit('error', error);
        else
            this.notifyChange(value, oldValue);
        if (this.reactions) {
            for (let reaction of this.reactions) {
                reaction.state = CellState.Dirty;
                Actualizator.Up(reaction);
            }
        }
    }

    protected compare(value: T) {
        return Object.is(value, this.value);
    }

    protected notifyChange(value: T, oldValue: T) {
        this.emit('change', {value, oldValue});
    }

    active() {
        this.isActive = true;
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
        if (eventName == 'change' && !this.isActive) {
            this.active();
            Actualizator.Down(this);
        }
    }

    protected unsubscribe(eventName: keyof { change: T }) {
        if (eventName == 'change' && this.isActive && !this.reactions)
            this.disactive();
    }

    addDependency(cell: BaseCell) {
        this.dependencies ??= new Set();
        this.dependencies.add(cell);
    }

    addReaction(cell: BaseCell) {
        this.reactions ??= new Set();
        this.reactions.add(cell);
        if (!this.isActive && cell.isActive)
            this.active();
    }

    removeReaction(cell: BaseCell) {
        if (!this.reactions)
            return;
        this.reactions.delete(cell);
        if (!this.reactions.size) {
            this.reactions = null;
            if (this.isActive && !this.listeners.get('change')?.length)
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

export class CyclicalPullError extends Error {
    constructor(public cell: BaseCell) {
        super('cyclical pull');
    }
}
